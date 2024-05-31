import axios from 'axios';

interface Options {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

function handleError(err: any) {
  throw err?.response?.data || err;
}

export async function fetchFromAPI(endpointURL: string, options?: Options) {
  try {
    const {method, body} = {method: 'GET', body: null, ...options};
    const res = await axios(`https://us-central1-royalfamilycards-415b5.cloudfunctions.net/api/${endpointURL}`, {
      method,
      ...(body && {data: body}),
      headers: {
        'Content-Type': 'application/json'
      },
    });

    return res.data;
  } catch (err) {
    handleError(err);
  }
}
