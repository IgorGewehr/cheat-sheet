// Server-side Firestore REST helper for squad API routes.
// Reads from open collections (squadPublic, presence, activity) using the web API key.
// No Firebase Admin SDK required.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = Record<string, any>;

function toFsValue(v: unknown): Obj {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFsValue) } };
  }
  if (typeof v === "object") {
    return { mapValue: toFsDoc(v as Obj) };
  }
  return { nullValue: null };
}

function toFsDoc(obj: Obj): { fields: Obj } {
  const fields: Obj = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = toFsValue(v);
  }
  return { fields };
}

function fromFsValue(v: Obj): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) {
    const values = (v.arrayValue as { values?: Obj[] })?.values ?? [];
    return values.map(fromFsValue);
  }
  if ("mapValue" in v) return fromFsDoc(v.mapValue as { fields?: Obj });
  return null;
}

function fromFsDoc(doc: { fields?: Obj }): Obj {
  if (!doc.fields) return {};
  const out: Obj = {};
  for (const [k, v] of Object.entries(doc.fields as Record<string, Obj>)) {
    out[k] = fromFsValue(v);
  }
  return out;
}

export async function fsGet(path: string): Promise<Obj | null> {
  const res = await fetch(`${FS_BASE}/${path}?key=${API_KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const doc = (await res.json()) as { fields?: Obj };
  return fromFsDoc(doc);
}

export async function fsList(path: string): Promise<Obj[]> {
  const res = await fetch(`${FS_BASE}/${path}?key=${API_KEY}&pageSize=50`);
  if (!res.ok) return [];
  const json = (await res.json()) as { documents?: Array<{ fields?: Obj }> };
  return (json.documents ?? []).map(fromFsDoc);
}

export async function fsQuery(params: {
  parent: string;
  collectionId: string;
  orderBy?: { field: string; direction?: "ASCENDING" | "DESCENDING" };
  limit?: number;
}): Promise<Obj[]> {
  const url = `${FS_BASE}/${params.parent}:runQuery?key=${API_KEY}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const structuredQuery: Obj = {
    from: [{ collectionId: params.collectionId }],
  };

  if (params.orderBy) {
    structuredQuery.orderBy = [
      {
        field: { fieldPath: params.orderBy.field },
        direction: params.orderBy.direction ?? "ASCENDING",
      },
    ];
  }
  if (params.limit) {
    structuredQuery.limit = params.limit;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
  });

  if (!res.ok) return [];

  const results = (await res.json()) as Array<{
    document?: { fields?: Obj };
    readTime?: string;
  }>;

  return results.filter((r) => r.document?.fields).map((r) => fromFsDoc(r.document!));
}

export async function fsSet(path: string, data: Obj): Promise<boolean> {
  const res = await fetch(`${FS_BASE}/${path}?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toFsDoc(data)),
  });
  return res.ok;
}

export async function fsCreate(collectionPath: string, docId: string, data: Obj): Promise<boolean> {
  return fsSet(`${collectionPath}/${docId}`, data);
}
