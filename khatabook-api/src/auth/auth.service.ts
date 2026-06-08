import { Injectable, ConflictException, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

interface GoogleTokenPayload {
  sub: string;       // Google user ID
  email: string;
  email_verified: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register a new shopkeeper (ADMIN) along with their shop.
   * Creates both a Shop and an ADMIN User in a single atomic transaction.
   */
  async register(data: RegisterDto) {
    console.log('[AuthService.register] Called with email:', data.email, 'shopName:', data.shopName);

    try {
      // 1. Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        console.log('[AuthService.register] Email already exists:', data.email);
        throw new ConflictException('An account with this email already exists');
      }

      // 2. Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);
      console.log('[AuthService.register] Password hashed successfully');

      // 3. Create Shop + Admin User atomically
      // Generate a short 6-character alphanumeric code for the shop
      const shopCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the shop first
        const shop = await tx.shop.create({
          data: {
            name: data.shopName,
            shopCode: shopCode,
            interestRate: data.interestRate ?? 0,
            defaultCreditDuration: data.defaultCreditDuration ?? 30,
          },
        });
        console.log('[AuthService.register] Shop created:', shop.id, shop.name);

        // Create the admin user linked to the shop
        const user = await tx.user.create({
          data: {
            shopId: shop.id,
            name: data.name,
            email: data.email,
            passwordHash: passwordHash,
            authProvider: 'EMAIL',
            role: 'ADMIN',
          },
        });
        console.log('[AuthService.register] Admin user created:', user.id, user.email);

        return { shop, user };
      });

      // 4. Generate JWT token so user is logged in immediately after registration
      const token = this.generateToken(result.user);
      console.log('[AuthService.register] Token generated for user:', result.user.id);

      return {
        token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          shopId: result.shop.id,
          shopName: result.shop.name,
          shopCode: result.shop.shopCode,
          avatarUrl: result.user.avatarUrl,
          authProvider: result.user.authProvider,
        },
      };
    } catch (error) {
      console.error('[AuthService.register] ERROR:', error.message || error);
      throw error;
    }
  }

  /**
   * Login with email and password.
   * Returns a JWT token on success.
   */
  async login(data: LoginDto) {
    console.log('[AuthService.login] Called with email:', data.email);

    try {
      // 1. Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: data.email },
        include: { shop: true },
      });

      if (!user) {
        console.log('[AuthService.login] User not found:', data.email);
        throw new UnauthorizedException('Invalid email or password');
      }

      // 2. Check if user has a password (Google-only users won't)
      if (!user.passwordHash) {
        console.log('[AuthService.login] User has no password (Google-only account):', data.email);
        throw new UnauthorizedException(
          'This account uses Google Sign-In. Please sign in with Google instead.',
        );
      }

      // 3. Compare password with hash
      const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

      if (!isPasswordValid) {
        console.log('[AuthService.login] Invalid password for:', data.email);
        throw new UnauthorizedException('Invalid email or password');
      }

      // 4. Generate JWT token
      const token = this.generateToken(user);
      console.log('[AuthService.login] Login successful for:', user.email, 'shopId:', user.shopId);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopId: user.shopId,
          shopName: user.shop.name,
          shopCode: user.shop.shopCode,
          avatarUrl: user.avatarUrl,
          authProvider: user.authProvider,
        },
      };
    } catch (error) {
      console.error('[AuthService.login] ERROR:', error.message || error);
      throw error;
    }
  }

  /**
   * Authenticate with Google. Handles three cases:
   * 1. Existing user with this googleId → login
   * 2. Existing user with this email (registered via email) → link Google account
   * 3. New user → create shop + user (auto-register)
   */
  async googleAuth(data: GoogleAuthDto) {
    console.log('[AuthService.googleAuth] Called with credential token');

    try {
      // 1. Verify the Google ID token
      const googlePayload = await this.verifyGoogleToken(data.credential);
      console.log('[AuthService.googleAuth] Token verified for:', googlePayload.email);

      const { sub: googleId, email, name, picture } = googlePayload;

      // 2. Check if user already exists by googleId
      let user = await this.prisma.user.findUnique({
        where: { googleId },
        include: { shop: true },
      });

      if (user) {
        // Case 1: Existing Google user → login
        console.log('[AuthService.googleAuth] Existing Google user found:', user.email);

        // Update avatar if changed
        if (picture && picture !== user.avatarUrl) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: picture },
          });
          user.avatarUrl = picture;
        }

        const token = this.generateToken(user);
        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            shopId: user.shopId,
            shopName: user.shop.name,
            shopCode: user.shop.shopCode,
            avatarUrl: user.avatarUrl,
            authProvider: user.authProvider,
          },
          isNewUser: false,
        };
      }

      // 3. Check if user exists by email (registered via email/password)
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { shop: true },
      });

      if (user) {
        // Case 2: Link Google account to existing email user
        console.log('[AuthService.googleAuth] Linking Google to existing email user:', user.email);

        const updatedUser = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatarUrl: picture || user.avatarUrl,
            authProvider: user.passwordHash ? 'BOTH' : 'GOOGLE',
          },
          include: { shop: true },
        });

        const token = this.generateToken(updatedUser);
        return {
          token,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            shopId: updatedUser.shopId,
            shopName: updatedUser.shop.name,
            shopCode: updatedUser.shop.shopCode,
            avatarUrl: updatedUser.avatarUrl,
            authProvider: updatedUser.authProvider,
          },
          isNewUser: false,
        };
      }

      // Case 3: Brand new user → auto-register with a default shop
      console.log('[AuthService.googleAuth] Creating new user via Google:', email);

      const shopCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const displayName = name || email.split('@')[0];

      const result = await this.prisma.$transaction(async (tx) => {
        const shop = await tx.shop.create({
          data: {
            name: `${displayName}'s Shop`,
            shopCode,
          },
        });

        const newUser = await tx.user.create({
          data: {
            shopId: shop.id,
            name: displayName,
            email,
            googleId,
            avatarUrl: picture || null,
            authProvider: 'GOOGLE',
            role: 'ADMIN',
          },
        });

        return { shop, user: newUser };
      });

      console.log('[AuthService.googleAuth] New user created:', result.user.id);

      const token = this.generateToken(result.user);
      return {
        token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          shopId: result.shop.id,
          shopName: result.shop.name,
          shopCode: result.shop.shopCode,
          avatarUrl: result.user.avatarUrl,
          authProvider: result.user.authProvider,
        },
        isNewUser: true,
      };
    } catch (error) {
      console.error('[AuthService.googleAuth] ERROR:', error.message || error);
      throw error;
    }
  }

  /**
   * Verify a Google ID token by calling Google's tokeninfo endpoint.
   * No extra npm packages required — uses native fetch.
   */
  private async verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new InternalServerErrorException('GOOGLE_CLIENT_ID is not configured on the server');
    }

    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[AuthService.verifyGoogleToken] Google rejected token:', errorBody);
        throw new UnauthorizedException('Invalid Google token');
      }

      const payload = (await response.json()) as GoogleTokenPayload & { aud: string };

      // Verify the token was issued for our app
      if (payload.aud !== googleClientId) {
        console.error('[AuthService.verifyGoogleToken] Token audience mismatch:', payload.aud);
        throw new UnauthorizedException('Google token was not issued for this application');
      }

      // Verify email is verified
      if (payload.email_verified !== 'true') {
        throw new UnauthorizedException('Google email is not verified');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('[AuthService.verifyGoogleToken] Fetch error:', error.message);
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * Update profile: user name and/or shop name.
   * Returns updated user info.
   */
  async updateProfile(userId: string, shopId: string, data: { name?: string; shopName?: string }) {
    console.log('[AuthService.updateProfile] Called for userId:', userId, 'data:', data);

    return this.prisma.$transaction(async (tx) => {
      let updatedUser: any;
      
      if (data.name) {
        updatedUser = await tx.user.update({
          where: { id: userId },
          data: { name: data.name },
          include: { shop: true },
        });
      } else {
        updatedUser = await tx.user.findUnique({
          where: { id: userId },
          include: { shop: true },
        });
      }

      if (data.shopName) {
        await tx.shop.update({
          where: { id: shopId },
          data: { name: data.shopName },
        });
      }

      // Refresh with latest shop data
      const finalUser = await tx.user.findUnique({
        where: { id: userId },
        include: { shop: true },
      });

      if (!finalUser) {
        throw new NotFoundException('User not found after update');
      }

      console.log('[AuthService.updateProfile] Updated successfully');

      return {
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        role: finalUser.role,
        shopId: finalUser.shopId,
        shopName: finalUser.shop.name,
        shopCode: finalUser.shop.shopCode,
        avatarUrl: finalUser.avatarUrl,
        authProvider: finalUser.authProvider,
      };
    });
  }

  /**
   * Generate a JWT token containing user info for authentication.
   */
  private generateToken(user: { id: string; email: string; role: string; shopId: string }): string {
    const secret = process.env.JWT_SECRET || 'mjrockseverybody';
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId,
    };

    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }
}
