import { GET as getHandler, POST as postHandler } from './create-order/route';

export async function GET(req) {
  return getHandler(req);
}

export async function POST(req) {
  return postHandler(req);
}
