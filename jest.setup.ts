// Optional: learn more at https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

const util = require("util");

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = util.TextDecoder;
}
