import { sign as signJWT, verify as verifyJWT, VerifyOptions } from 'jsonwebtoken'
import keys from './keys.json'

const JWT_ALG = 'RS256'
// the keys are attached with the headers in code
// this is because storing new lines in GH actions secrets causes weird issues	
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----\n${keys.private_key}\n-----END RSA PRIVATE KEY-----`
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\n${keys.public_key}\n-----END PUBLIC KEY-----`

export const TOKEN_EXPIRY = 60 * 24

export type GenerateJWTOptions = {
    user: {
        id: string
    }
	expirationMinutes?: number
}

export type IJWT = {
	exp: number
	iat: number
	user: {
		id: string
	}
}

export const generateAccessToken = (opts: GenerateJWTOptions) => {
	const jwt = generateJwt(opts)
	const token = signJWT(jwt, PRIVATE_KEY, { algorithm: JWT_ALG })
	return token
}

export function generateJwt({
	user,
	expirationMinutes = TOKEN_EXPIRY
}: GenerateJWTOptions) {
	const iat = Math.floor(Date.now() / 1000)
	const exp = iat + (expirationMinutes * 60)
	const jwt: IJWT = {
        user,
		iat,
		exp
	}
	return jwt
}

export const validateAccessToken = (token: string, opts?: VerifyOptions) => {
	try {
		const user = verifyJWT(token, PUBLIC_KEY, {
			algorithms: [ JWT_ALG ],
			...(opts || {})
		}) as IJWT
		return user
	} catch(error) {
		throw new Error(error.message)
	}
}