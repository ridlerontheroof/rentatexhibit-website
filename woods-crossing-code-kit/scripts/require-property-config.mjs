const path = process.env.PROPERTY_CONFIG_PATH || process.argv[2];
if (!path) {
  throw new Error("PROPERTY_CONFIG_PATH (or an explicit config path argument) is required for property prepublish");
}
process.stdout.write(`property release config selected: ${path}\n`);