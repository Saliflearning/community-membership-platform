const [major, minor] = process.versions.node.split(".").map(Number);

if (major < 20 || (major === 20 && minor < 9)) {
  console.error(`Node ${process.versions.node} is not supported. Use Node >=20.9.0.`);
  process.exit(1);
}
