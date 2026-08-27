import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, verifyAuthToken } from '@/lib/auth';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentPassword, newPassword, targetUserId } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Determine acting user from cookie or dataStore
    const token = req.cookies.get('erp_auth_token')?.value;
    let actingUserId = dataStore.getCurrentUser()?.id || 'usr-admin';

    if (token) {
      const decoded = verifyAuthToken(token);
      if (decoded?.userId) {
        actingUserId = decoded.userId;
      }
    }

    let actingUser: any = await prisma.user.findUnique({ where: { id: actingUserId } }).catch(() => null);
    if (!actingUser) {
      actingUser = dataStore.getUserById(actingUserId) || dataStore.getCurrentUser();
    }
    const isSuperAdmin = actingUser?.role === 'SUPER_ADMIN';

    // If super admin is resetting another user's password directly:
    if (targetUserId && targetUserId !== actingUserId) {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Only Super Administrators can reset other users\' passwords' }, { status: 403 });
      }

      let target: any = await prisma.user.findUnique({ where: { id: targetUserId } }).catch(() => null);
      if (!target) {
        target = dataStore.getUserById(targetUserId);
      }
      if (!target) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }

      const newHash = hashPassword(newPassword);

      // Update in DB
      await prisma.user.update({
        where: { id: targetUserId },
        data: { passwordHash: newHash },
      }).catch(async () => {
        await prisma.$executeRawUnsafe(
          `UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
          newHash,
          targetUserId
        ).catch(() => {});
      });

      // Update in dataStore
      dataStore.updateUser(targetUserId, { passwordHash: newHash });

      dataStore.addAuditLog({
        action: 'USER_PERMISSION_CHANGE',
        entityType: 'USER',
        entityId: target.id,
        entityLabel: `${target.name} (${target.role})`,
        description: `Password reset by Super Admin (${actingUser?.name || 'Admin'})`,
      });

      return NextResponse.json({ success: true, message: `Password for ${target.name} has been reset successfully` });
    }

    // User changing their own password:
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
    }

    const rawUsers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, email, "passwordHash" FROM "User" WHERE id = $1 LIMIT 1`,
      actingUserId
    ).catch(() => []);
    
    let user = rawUsers.length > 0 ? rawUsers[0] : null;
    if (!user) {
      user = dataStore.getUserById(actingUserId);
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = verifyPassword(currentPassword, user.passwordHash, user.email);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = hashPassword(newPassword);

    // Update in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    }).catch(async () => {
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
        newHash,
        user.id
      ).catch(() => {});
    });

    // Update in dataStore
    dataStore.updateUser(user.id, { passwordHash: newHash });

    dataStore.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: `${user.name} (${user.role})`,
      description: `User changed their password`,
    });

    return NextResponse.json({ success: true, message: 'Your password has been changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 });
  }
}
