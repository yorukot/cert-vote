type FetcherArgs = [input: RequestInfo | URL, init?: RequestInit];

const fetcher = (...args: FetcherArgs): Promise<any> =>
  fetch(...args).then((res) => res.json());

export default fetcher