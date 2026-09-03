import http from "http";

http.get("http://localhost:5000/storage/TalentSense_AI%20(1).zip", (res) => {
  console.log("Response status code:", res.statusCode);
  console.log("Headers:", res.headers["content-type"], res.headers["content-length"]);
  let size = 0;
  res.on("data", (chunk) => {
    size += chunk.length;
  });
  res.on("end", () => {
    console.log(`Successfully received ${size} bytes from Express backend!`);
  });
}).on("error", (err) => {
  console.error("HTTP Request Error:", err.message);
});
