const empty = {};

export default empty;

export function readFileSync(): never {
  throw new Error("Node fs is not available in the browser.");
}
