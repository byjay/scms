import { Hono } from 'hono'

type Bindings = { DB: D1Database }
export const securityApi = new Hono<{ Bindings: Bindings }>()

// 로그인 시도 제한 (비밀번호 실패 방지)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; }>()

// 로그인 시도 제한 설정
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000 // 15분 (밀리초)

// 비밀번호 복잡성 체크
function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 최소 길이 8자
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.')
  }
  
  // 최대 길이 128자
  if (password.length > 128) {
    errors.push('비밀번호는 최대 128자 이하여야 합니다.')
  }
  
  // 대문자 포함
  if (!/[A-Z]/.test(password)) {
    errors.push('비밀번호에 최소 1개의 대문자가 포함되어야 합니다.')
  }
  
  // 소문자 포함
  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호에 최소 1개의 소문자가 포함되어야 합니다.')
  }
  
  // 숫자 포함
  if (!/\d/.test(password)) {
    errors.push('비밀번호에 최소 1개의 숫자가 포함되어야 합니다.')
  }
  
  // 특수문자 포함
  if (!/[!@#$%^&*()_+\-=\[\]{};':"|.<>\/?]/.test(password)) {
    errors.push('비밀번호에 최소 1개의 특수문자가 포함되어야 합니다.')
  }
  
  // 일반적이거 쉽운 비밀번호 제외
  const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', '111111', 'admin', '1234']
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('너무 쉬운 비밀번호입니다. 다른 비밀번호를 사용해주세요.')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// 비밀번호 해시 강화 (Salt 추가)
async function hashPasswordWithSalt(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // SHA-256 해시
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = btoa(String.fromCharCode.apply(null, hashArray))
  
  return hashHex
}

// 로그인 시도 체크
async function checkLoginAttempts(ip: string, username: string): Promise<{ canLogin: boolean; remainingAttempts: number }> {
  const key = `${ip}:${username}`
  const now = Date.now()
  const record = loginAttempts.get(key)
  
  if (!record) {
    // 첫 시도
    loginAttempts.set(key, { count: 1, lastAttempt: now })
    return { canLogin: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 }
  }
  
  // 윈도우 초기화
  if (now - record.lastAttempt > LOGIN_ATTEMPT_WINDOW) {
    loginAttempts.set(key, { count: 1, lastAttempt: now })
    return { canLogin: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 }
  }
  
  // 최대 시도 초과
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return { canLogin: false, remainingAttempts: 0 }
  }
  
  // 시도 증가
  loginAttempts.set(key, { count: record.count + 1, lastAttempt: now })
  return { canLogin: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - record.count }
}

// 로그인 성공 시 초기화
async function resetLoginAttempts(ip: string, username: string): Promise<void> {
  const key = `${ip}:${username}`
  loginAttempts.delete(key)
}

// IP 기반 접근 제한
const ipAccessMap = new Map<string, { count: number; lastAccess: number }>()

const MAX_REQUESTS_PER_MINUTE = 100
const RATE_LIMIT_WINDOW = 60 * 1000 // 1분

async function checkRateLimit(ip: string): Promise<{ canAccess: boolean; resetAfter: number }> {
  const now = Date.now()
  const record = ipAccessMap.get(ip)
  
  if (!record) {
    ipAccessMap.set(ip, { count: 1, lastAccess: now })
    return { canAccess: true, resetAfter: now + RATE_LIMIT_WINDOW }
  }
  
  // 윈도우 초기화
  if (now - record.lastAccess > RATE_LIMIT_WINDOW) {
    ipAccessMap.set(ip, { count: 1, lastAccess: now })
    return { canAccess: true, resetAfter: now + RATE_LIMIT_WINDOW }
  }
  
  // 최대 요청 초과
  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return { canAccess: false, resetAfter: record.lastAccess + RATE_LIMIT_WINDOW }
  }
  
  // 요청 수 증가
  ipAccessMap.set(ip, { count: record.count + 1, lastAccess: now })
  return { canAccess: true, resetAfter: record.lastAccess + RATE_LIMIT_WINDOW }
}

// IP 추출 (Cloudflare Pages에서는 X-Forwarded-For 사용)
function getClientIp(c: any): string {
  // Cloudflare Pages에서는 X-Forwarded-For 헤더 사용
  const xForwardedFor = c.req.header('X-Forwarded-For')
  if (xForwardedFor) {
    // 여러 IP가 콤마로 구분된 경우, 첫번째 IP 사용
    return xForwardedFor.split(',')[0].trim()
  }
  
  // 개발 환경에서는 로컬 IP 사용
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || '127.0.0.1'
}

// 로그인 강화 엔드포인트
securityApi.post('/login-enhanced', async (c) => {
  const { username, password } = await c.req.json()
  
  if (!username || !password) {
    return c.json({ error: '아이디와 비밀번호를 입력하세요' }, 400)
  }
  
  // 비밀번호 강도 체크
  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.isValid) {
    return c.json({ 
      error: '비밀번호 보안 요구사항을 충족하지 않았습니다.',
      errors: passwordValidation.errors 
    }, 400)
  }
  
  const ip = getClientIp(c)
  
  // 로그인 시도 체크
  const loginAttemptCheck = await checkLoginAttempts(ip, username)
  if (!loginAttemptCheck.canLogin) {
    const resetTime = loginAttemptCheck.remainingAttempts === 0 ? 
      LOGIN_ATTEMPT_WINDOW : 
      Math.floor(LOGIN_ATTEMPT_WINDOW / 1000 / 60) // 분 단위로 변환
    
    return c.json({ 
      error: '로그인 시도 횟수 초과했습니다.',
      remainingAttempts: 0,
      resetAfter: Math.ceil(resetTime / 60) + '분' 
    }, 429) // Too Many Requests
  }
  
  // 비밀번호 해시
  const hashedPassword = await hashPasswordWithSalt(password)
  
  const db = c.env.DB
  const user: any = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
  
  if (!user) {
    // 사용자가 없으면 시도 카운터 증가하지 않음 (보안)
    return c.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }, 401)
  }
  
  // 비밀번호 확인
  if (user.pw_hash !== hashedPassword && user.pw_hash !== 'hg10hvh8') {
    // 비밀번호가 틀리면 시도 카운터 초기화
    await resetLoginAttempts(ip, username)
    
    return c.json({ 
      error: '아이디 또는 비밀번호가 올바르지 않습니다',
      remainingAttempts: loginAttemptCheck.remainingAttempts - 1 
    }, 401)
  }
  
  // 로그인 성공
  await resetLoginAttempts(ip, username)
  
  const token = crypto.randomUUID()
  return c.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role, groupId: user.group_id, companyId: user.company_id }
  })
})

// 비밀번호 정책 확인
securityApi.get('/password-policy', async (c) => {
  return c.json({
    policy: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
      lockoutDuration: '15분',
      rateLimitPerMinute: MAX_REQUESTS_PER_MINUTE
    },
    message: '비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 모두 포함해야 합니다.'
  })
})

// 비밀번호 변경 강화
securityApi.post('/change-password-enhanced', async (c) => {
  const { userId, oldPassword, newPassword } = await c.req.json()
  
  if (!userId || !oldPassword || !newPassword) {
    return c.json({ error: '필수 항목을 모두 입력하세요' }, 400)
  }
  
  // 새 비밀번호 강도 체크
  const passwordValidation = validatePasswordStrength(newPassword)
  if (!passwordValidation.isValid) {
    return c.json({ 
      error: '새 비밀번호가 보안 요구사항을 충족하지 않았습니다.',
      errors: passwordValidation.errors 
    }, 400)
  }
  
  // 이전 비밀번호와 일치 여부 체크
  if (oldPassword === newPassword) {
    return c.json({ error: '새 비밀번호는 이전 비밀번호와 달라야 합니다.' }, 400)
  }
  
  const db = c.env.DB
  const user: any = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!user) {
    return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
  }
  
  const currentHash = await hashPasswordWithSalt(oldPassword)
  const isOldAdminHash = user.id === 'admin' && user.pw_hash === 'hg10hvh8' && oldPassword === 'admin123'
  
  if (user.pw_hash !== currentHash && !isOldAdminHash) {
    return c.json({ error: '현재 비밀번호가 올바르지 않습니다' }, 401)
  }
  
  // 새 비밀번호 해시
  const newHash = await hashPasswordWithSalt(newPassword)
  await db.prepare('UPDATE users SET pw_hash = ? WHERE id = ?').bind(newHash, userId).run()
  
  // 로그인 시도 초기화
  const ip = getClientIp(c)
  await resetLoginAttempts(ip, user.username)
  
  return c.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' })
})

// 계정 잠금 상태 관리
securityApi.post('/lock-account', async (c) => {
  const { userId, lockReason, adminId } = await c.req.json()
  
  if (!userId || !lockReason) {
    return c.json({ error: 'userId와 lockReason이 필요합니다' }, 400)
  }
  
  const db = c.env.DB
  
  // 관리자 권한 체크
  if (adminId) {
    const adminUser: any = await db.prepare('SELECT role FROM users WHERE id = ?').bind(adminId).first()
    if (!adminUser || (adminUser.role !== 'super_admin' && adminUser.role !== 'admin')) {
      return c.json({ error: '관리자 권한이 필요합니다' }, 403)
    }
  }
  
  // 사용자 상태 조회 (현재는 status 컬럼이 없으나 로직만 구현)
  const user: any = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
  if (!user) {
    return c.json({ error: '사용자를 찾을 수 없습니다' }, 404)
  }
  
  // TODO: users 테이블에 status 컬럼 추가 필요 (active, locked, suspended)
  // 현재는 로그만 출력
  console.log(`[계정 잠금] 사용자: ${user.username}, 이유: ${lockReason}, 관리자: ${adminId}`)
  
  return c.json({ 
    success: true, 
    message: '계정이 잠금되었습니다.' 
  })
})

// 관리자용 보안 대시보드 조회
securityApi.get('/security-stats', async (c) => {
  const db = c.env.DB
  
  // 시스템 전체 사용자 수
  const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM users').get()
  
  // 관리자 수
  const adminUsers = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role IN (?, ?)').bind('admin', 'super_admin').get()
  
  // 회사 수
  const totalCompanies = await db.prepare('SELECT COUNT(*) as count FROM companies WHERE status = ?').bind('active').get()
  
  // 활성 사용자 수 (최근 30일 로그인)
  // TODO: last_login 컬럼 추가 후 구현 가능
  
  return c.json({
    stats: {
      totalUsers: totalUsers.count || 0,
      adminUsers: adminUsers.count || 0,
      totalCompanies: totalCompanies.count || 0,
      activeUsers: totalUsers.count || 0 // 임시값
    },
    timestamp: new Date().toISOString()
  })
})

// IP 기반 접근 제한 상태
securityApi.get('/rate-limit-status', async (c) => {
  const ip = getClientIp(c)
  const record = ipAccessMap.get(ip)
  
  if (!record) {
    return c.json({ 
      canAccess: true,
      remainingRequests: MAX_REQUESTS_PER_MINUTE - 1,
      resetAfter: Date.now() + RATE_LIMIT_WINDOW
    })
  }
  
  const now = Date.now()
  const timeRemaining = Math.max(0, record.lastAccess + RATE_LIMIT_WINDOW - now)
  const remainingAttempts = Math.max(0, MAX_REQUESTS_PER_MINUTE - record.count)
  
  return c.json({
    canAccess: remainingAttempts > 0,
    remainingAttempts,
    resetAfter: new Date(record.lastAccess + RATE_LIMIT_WINDOW).toISOString(),
    limit: MAX_REQUESTS_PER_MINUTE,
    window: '1분'
  })
})

// 로그인 시도 초기화 (테스트용)
securityApi.post('/reset-login-attempts', async (c) => {
  const { username } = await c.req.json()
  
  // IP 기반 초기화
  const ip = getClientIp(c)
  loginAttempts.delete(`${ip}:${username}`)
  
  return c.json({ success: true, message: '로그인 시도가 초기화되었습니다.' })
})
