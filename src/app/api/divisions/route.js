import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

export async function GET() {
    try {
        const divisions = await db("divisions").select("*").orderBy("id");
        return NextResponse.json(divisions);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch divisions"}, { status: 500})
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email } = body;

        if (!name || name.trim() === ""){
            return NextResponse.json({ error: "Division name is required"}, {status: 400});
        }

        const [id] = await db("divisions").insert({
            name: name.trim(),
        });

        const newDivision = await db("divisions").where( { id }).first();

        await logActivity({
            email: email || "unknown",
            action: "Division Added",
            comment: `Added division "${newDivision.name}"`,
            divisionId: newDivision.id,
        });

        return NextResponse.json(newDivision, { status: 201})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create division"}, { status: 500});
    }
}