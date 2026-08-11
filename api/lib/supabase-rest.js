const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
async function authGetUser(token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { id: data.id, email: data.email ?? null };
  } catch {
    return null;
  }
}
async function rpc(functionName, params) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { data: null, error: err };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: { message: error.message } };
  }
}
function baseHeaders(extra) {
  return {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}
function parseContentRange(header) {
  if (!header) return null;
  const m = header.match(/\d+-\d+\/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
class SupabaseQuery {
  table;
  selectCols = "*";
  filters = [];
  orderCol = null;
  orderAsc = true;
  limitN = null;
  offsetN = 0;
  wantCount = false;
  constructor(table) {
    this.table = table;
  }
  select(columns, options) {
    if (columns !== void 0) this.selectCols = columns || "*";
    if (options?.count) this.wantCount = true;
    return this;
  }
  eq(column, value) {
    this.filters.push({ col: column, op: "eq", val: encodeURIComponent(String(value)) });
    return this;
  }
  neq(column, value) {
    this.filters.push({ col: column, op: "neq", val: encodeURIComponent(String(value)) });
    return this;
  }
  gt(column, value) {
    this.filters.push({ col: column, op: "gt", val: encodeURIComponent(String(value)) });
    return this;
  }
  gte(column, value) {
    this.filters.push({ col: column, op: "gte", val: encodeURIComponent(String(value)) });
    return this;
  }
  lt(column, value) {
    this.filters.push({ col: column, op: "lt", val: encodeURIComponent(String(value)) });
    return this;
  }
  lte(column, value) {
    this.filters.push({ col: column, op: "lte", val: encodeURIComponent(String(value)) });
    return this;
  }
  is(column, value) {
    this.filters.push({ col: column, op: "is", val: String(value) });
    return this;
  }
  in(column, values) {
    const encoded = values.map((v) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }).join(",");
    this.filters.push({ col: column, op: "in", val: `(${encoded})` });
    return this;
  }
  order(column, options) {
    this.orderCol = column;
    this.orderAsc = options?.ascending ?? true;
    return this;
  }
  limit(n) {
    this.limitN = n;
    return this;
  }
  range(from, to) {
    this.offsetN = from;
    this.limitN = to - from + 1;
    return this;
  }
  buildUrl() {
    const params = new URLSearchParams();
    params.set("select", this.selectCols);
    for (const f of this.filters) {
      params.set(f.col, `${f.op}.${f.val}`);
    }
    if (this.orderCol) {
      params.set("order", `${this.orderCol}.${this.orderAsc ? "asc" : "desc"}`);
    }
    if (this.limitN !== null) params.set("limit", String(this.limitN));
    if (this.offsetN > 0) params.set("offset", String(this.offsetN));
    return `${SUPABASE_URL}/rest/v1/${this.table}?${params.toString()}`;
  }
  async execute() {
    try {
      const prefer = this.wantCount ? { "Prefer": "count=exact" } : {};
      const res = await fetch(this.buildUrl(), { headers: baseHeaders(prefer) });
      const count = parseContentRange(res.headers.get("content-range"));
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { data: null, error: err, count };
      }
      const data = await res.json();
      return { data, error: null, count };
    } catch (error) {
      return { data: null, error: { message: error.message }, count: null };
    }
  }
  // Awaitable — resolves with standard supabase shape
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
  async maybeSingle() {
    this.limitN = 1;
    const result = await this.execute();
    if (result.error) return { data: null, error: result.error };
    return { data: result.data?.[0] ?? null, error: null };
  }
  async single() {
    return this.maybeSingle();
  }
}
class SupabaseMutator {
  table;
  method = "POST";
  bodyData = null;
  filters = [];
  selectCols = "*";
  preferParts = ["return=representation"];
  onConflictCol = null;
  isUpsert = false;
  constructor(table) {
    this.table = table;
  }
  eq(column, value) {
    this.filters.push({ col: column, op: "eq", val: encodeURIComponent(String(value)) });
    return this;
  }
  select(columns) {
    if (columns !== void 0) this.selectCols = columns || "*";
    return this;
  }
  // Initiate insert (chain continues with .select() before await)
  insert(records, options) {
    this.method = "POST";
    this.bodyData = records;
    if (options?.count) this.preferParts.push(`count=${options.count}`);
    return this;
  }
  upsert(records, options) {
    this.method = "POST";
    this.bodyData = records;
    this.isUpsert = true;
    this.onConflictCol = options?.onConflict || null;
    this.preferParts = ["return=representation", "resolution=merge-duplicates"];
    if (options?.count) this.preferParts.push(`count=${options.count}`);
    return this;
  }
  update(record, options) {
    this.method = "PATCH";
    this.bodyData = record;
    if (options?.count) this.preferParts.push(`count=${options.count}`);
    return this;
  }
  delete(options) {
    this.method = "DELETE";
    this.bodyData = null;
    if (options?.count) this.preferParts.push(`count=${options.count}`);
    return this;
  }
  buildUrl() {
    const params = new URLSearchParams();
    params.set("select", this.selectCols);
    for (const f of this.filters) {
      params.set(f.col, `${f.op}.${f.val}`);
    }
    if (this.isUpsert && this.onConflictCol) {
      params.set("on_conflict", this.onConflictCol);
    }
    const qs = params.toString();
    return `${SUPABASE_URL}/rest/v1/${this.table}${qs ? "?" + qs : ""}`;
  }
  async execute() {
    try {
      const res = await fetch(this.buildUrl(), {
        method: this.method,
        headers: baseHeaders({ "Prefer": this.preferParts.join(", ") }),
        body: this.bodyData !== null ? JSON.stringify(this.bodyData) : void 0
      });
      const count = parseContentRange(res.headers.get("content-range"));
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { data: null, error: err, count };
      }
      let data = [];
      if (res.status !== 204) {
        const body = await res.json();
        data = Array.isArray(body) ? body : [body];
      }
      return { data, error: null, count };
    } catch (error) {
      return { data: null, error: { message: error.message }, count: null };
    }
  }
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
}
function createClient() {
  return {
    from(table) {
      return {
        select: (columns, options) => {
          const q = new SupabaseQuery(table);
          return q.select(columns, options);
        },
        insert: (records, options) => {
          const m = new SupabaseMutator(table);
          return m.insert(records, options);
        },
        upsert: (records, options) => {
          const m = new SupabaseMutator(table);
          return m.upsert(records, options);
        },
        update: (record, options) => {
          const m = new SupabaseMutator(table);
          return m.update(record, options);
        },
        delete: (options) => {
          const m = new SupabaseMutator(table);
          return m.delete(options);
        }
      };
    },
    rpc,
    auth: {
      getUser: async (token) => {
        const user = await authGetUser(token);
        if (!user) return { data: { user: null }, error: { message: "Invalid token" } };
        return { data: { user }, error: null };
      }
    }
  };
}
var supabase_rest_default = { createClient };
export {
  authGetUser,
  createClient,
  supabase_rest_default as default,
  rpc
};
