// Minimal ambient module to silence TypeScript when pocketbase types are not installed
declare module 'pocketbase' {
  const PocketBase: any;
  export default PocketBase;
}
