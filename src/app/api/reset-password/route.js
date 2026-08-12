import db from '@/lib/db'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/logActivity";
import bcrypt from "bcrypt";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, currentPassword, newPassword } = body;

        if (!email || email.trim() === "") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        if (!currentPassword) {
            return NextResponse.json({ error: "Current password is required" }, { status: 400 });
        }
        if (!newPassword || newPassword.trim().length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        const existingUser = await db("users").where({ email: email.trim() }).first();
        if (!existingUser) {
            // Don't reveal whether the email exists
            return NextResponse.json({ error: "Invalid email or current password" }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid email or current password" }, { status: 400 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword.trim(), 10);

        await db("users").where({ id: existingUser.id }).update({
            password: hashedNewPassword,
        });

        await logActivity({
            email: existingUser.email,
            action: "Password Reset",
            comment: `User "${existingUser.name}" (${existingUser.email}) reset their password`,
            locationId: null,
        });

        return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to reset password" },
            { status: 500 }
        );
    }
}