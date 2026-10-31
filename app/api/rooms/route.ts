// Legacy build rooms have been replaced by the versioned arcade API.
export async function GET(){return Response.json({error:'Build rooms moved to the Games tab. Create a new arcade room.'},{status:410})}
export const POST=GET;
