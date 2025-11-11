export const apiClient = {
  async get(path: string, config: RequestInit = {}) {
    return await request(path, { ...config, method: "GET" });
  },

  async post(path: string, body: any = {}, config: RequestInit = {}) {
    return await request(path, {
      ...config,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      },
      body: JSON.stringify(body),
    });
  },

  async put(path: string, body: any = {}, config: RequestInit = {}) {
    return await request(path, {
      ...config,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      },
      body: JSON.stringify(body),
    });
  },

  async patch(path: string, body: any = {}, config: RequestInit = {}) {
    return await request(path, {
      ...config,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      },
      body: JSON.stringify(body),
    });
  },

  async del(path: string, config: RequestInit = {}) {
    return await request(path, { ...config, method: "DELETE" });
  },
};

async function request(path: string, config: RequestInit) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...config,
    credentials: "include", // baked in forever
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || `API error: ${res.status}`);
  }

  return data;
}
