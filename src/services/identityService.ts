import prisma from "../lib/prisma";

export interface ConsolidatedContact {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export async function resolveIdentity(
  email?: string,
  phoneNumber?: string,
): Promise<ConsolidatedContact> {
  const directMatches = await prisma.contact.findMany({
    where: {
      deletedAt: null,
      OR: [
        ...(email ? [{ email }] : []),
        ...(phoneNumber ? [{ phoneNumber }] : []),
      ],
    },
  });

  if (directMatches.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: "primary",
      },
    });

    return {
      primaryContatctId: newContact.id,
      emails: newContact.email ? [newContact.email] : [],
      phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
      secondaryContactIds: [],
    };
  }

  const rootIds = new Set<number>();
  for (const contact of directMatches) {
    if (contact.linkPrecedence === "primary") {
      rootIds.add(contact.id);
    } else if (contact.linkedId !== null) {
      rootIds.add(contact.linkedId);
    }
  }

  const rootIdArray = Array.from(rootIds);

  let cluster = await prisma.contact.findMany({
    where: {
      deletedAt: null,
      OR: [{ id: { in: rootIdArray } }, { linkedId: { in: rootIdArray } }],
    },
    orderBy: { createdAt: "asc" },
  });

  const primaries = cluster.filter((c) => c.linkPrecedence === "primary");
  const truePrimary = primaries.reduce((oldest, c) =>
    c.createdAt < oldest.createdAt ? c : oldest,
  );

  const demotedPrimaries = primaries.filter((c) => c.id !== truePrimary.id);
  if (demotedPrimaries.length > 0) {
    const demotedIds = demotedPrimaries.map((c) => c.id);

    await prisma.contact.updateMany({
      where: { id: { in: demotedIds } },
      data: { linkPrecedence: "secondary", linkedId: truePrimary.id },
    });

    await prisma.contact.updateMany({
      where: { linkedId: { in: demotedIds }, deletedAt: null },
      data: { linkedId: truePrimary.id },
    });

    cluster = await prisma.contact.findMany({
      where: {
        deletedAt: null,
        OR: [{ id: truePrimary.id }, { linkedId: truePrimary.id }],
      },
      orderBy: { createdAt: "asc" },
    });
  }

  const existingEmails = new Set(cluster.map((c) => c.email).filter(Boolean));
  const existingPhones = new Set(
    cluster.map((c) => c.phoneNumber).filter(Boolean),
  );

  const hasNewEmail = email && !existingEmails.has(email);
  const hasNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  if (hasNewEmail || hasNewPhone) {
    await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkedId: truePrimary.id,
        linkPrecedence: "secondary",
      },
    });

    cluster = await prisma.contact.findMany({
      where: {
        deletedAt: null,
        OR: [{ id: truePrimary.id }, { linkedId: truePrimary.id }],
      },
      orderBy: { createdAt: "asc" },
    });
  }

  const secondaries = cluster.filter((c) => c.linkPrecedence === "secondary");

  const emails = [
    ...(truePrimary.email ? [truePrimary.email] : []),
    ...secondaries.map((c) => c.email).filter((e): e is string => e !== null),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const phoneNumbers = [
    ...(truePrimary.phoneNumber ? [truePrimary.phoneNumber] : []),
    ...secondaries
      .map((c) => c.phoneNumber)
      .filter((p): p is string => p !== null),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const secondaryContactIds = secondaries.map((c) => c.id);

  return {
    primaryContatctId: truePrimary.id,
    emails,
    phoneNumbers,
    secondaryContactIds,
  };
}
