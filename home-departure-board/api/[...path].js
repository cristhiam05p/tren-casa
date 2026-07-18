let appPromise;

function getApp() {
  appPromise ??= import("../packages/backend/dist/server.js").then((module) => module.default);
  return appPromise;
}

export default async function handler(request, response) {
  const app = await getApp();
  return app(request, response);
}
