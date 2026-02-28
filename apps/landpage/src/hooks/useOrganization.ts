import { useState, useEffect } from 'react';

export interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan: string;
  is_active: boolean;
}

export function useOrganization() {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;

    fetch(`/api/v1/organizations/domain/${hostname}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            window.location.href = '/404';
            return;
          }
          throw new Error(`Erro ${res.status}`);
        }
        const json = await res.json();
        setOrg(json.data ?? json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { org, loading, error };
}
