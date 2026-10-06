import { useEffect, useState } from 'react';
import { useAuth } from '../context/authState';
export function useAdminData(path) {
  const { request } = useAuth();
  const [revision, setRevision] = useState(0), [result, setResult] = useState({});
  useEffect(() => {
    let active = true;
    request(path).then(data => { if (active) setResult({ path, revision, data }); })
      .catch(error => { if (active) setResult({ path, revision, error: error.message }); });
    return () => { active = false; };
  }, [request, path, revision]);
  const current = result.path === path && result.revision === revision;
  return { data: current ? result.data : null, error: current ? result.error : '', loading: !current, retry: () => setRevision(x => x + 1) };
}
