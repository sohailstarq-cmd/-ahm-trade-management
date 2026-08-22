import { prisma } from "./db";

/**
 * Atomically issues the next number for a given prefix base (e.g. "AMT-TC",
 * "AMT-BI"), formatted as PREFIX-YEAR-00001. Resets to 00001 each calendar
 * year, per your confirmed requirement. Uses a dedicated counter row and a
 * transaction so two simultaneous requests never get the same number.
 */
export async function getNextNumber(prefixBase: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${prefixBase}-${year}`;

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberSequence.findUnique({ where: { prefix } });
    const nextNumber = (existing?.lastNumber ?? 0) + 1;
    await tx.numberSequence.upsert({
      where: { prefix },
      update: { lastNumber: nextNumber },
      create: { prefix, lastNumber: nextNumber },
    });
    return nextNumber;
  });

  return `${prefix}-${String(result).padStart(5, "0")}`;
}

/** Simple sequential codes for buyers/sellers, not year-scoped: BYR-00001, SEL-00001. */
export async function getNextPartyCode(kind: "BYR" | "SEL"): Promise<string> {
  const prefix = kind;
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.numberSequence.findUnique({ where: { prefix } });
    const nextNumber = (existing?.lastNumber ?? 0) + 1;
    await tx.numberSequence.upsert({
      where: { prefix },
      update: { lastNumber: nextNumber },
      create: { prefix, lastNumber: nextNumber },
    });
    return nextNumber;
  });
  return `${prefix}-${String(result).padStart(5, "0")}`;
}
