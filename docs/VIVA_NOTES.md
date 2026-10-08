# Viva Preparation Notes

This document contains 15 probable questions an examiner might ask during your final project viva, along with strong, defensible answers.

## Architecture & Stack
**1. Why did you choose React + Node + MongoDB for this project instead of a relational database or a Python backend?**
*Answer:* I chose the MERN stack for its unified language ecosystem (JavaScript everywhere), rapid development cycle, and the fact that MongoDB's document model perfectly fits time-series-like data. A NoSQL DB easily accommodates the flexible nature of energy readings, while Node.js's event-driven architecture handles high I/O operations (like our data ingestion simulator) exceptionally well without the overhead of Python's GIL.

**2. How does the frontend communicate with the backend securely?**
*Answer:* The frontend uses Axios to send HTTP requests to the REST API. Security is maintained using JSON Web Tokens (JWT). Upon login, the server signs a token which the client stores locally. An Axios interceptor automatically attaches this token as a Bearer header to every subsequent request. 

**3. What happens if the JWT token is stolen?**
*Answer:* To mitigate this, tokens have a strict expiry time. Additionally, the backend implements CORS to prevent cross-origin requests from unauthorized domains, and Helmet to secure HTTP headers. For production, the system mandates HTTPS, ensuring the token cannot be intercepted in transit via packet sniffing.

## Database & Performance
**4. You have an \`EnergyRecord\` collection storing hourly readings. Won't this get massive? How did you optimize it?**
*Answer:* Yes, 10 units over 1 year generate ~87,600 records. To optimize, I added a compound index on \`{ unitId: 1, timestamp: -1 }\`. This makes time-range queries (like "give me the last 7 days of consumption for Unit A") extremely fast. In the future, this can be migrated to MongoDB's native Time Series collections.

**5. Why didn't you use a separate \`Reports\` collection?**
*Answer:* Reports are derived data. Storing them would violate the single source of truth and create a synchronization overhead. Instead, the backend computes reports and analytics dynamically on-demand using MongoDB's Aggregation Pipeline (\`$match\`, \`$group\`, \`$sum\`), which is highly optimized and runs directly on the database engine.

## Core Logic & Intelligence
**6. How does your Anomaly Detection work? Did you use Machine Learning?**
*Answer:* No, using deep learning for this MVP would be over-engineering. I used a statistical Z-Score approach. The system calculates the historical mean and standard deviation for a specific "hour of the week". If a new reading is more than 3 standard deviations away from the mean (Z-Score > 3), it flags it as an anomaly. It's fast, deterministic, and highly effective for stable patterns.

**7. How does the Forecasting model predict future energy usage?**
*Answer:* It uses a Seasonal Naïve approach combined with a Moving Average. Energy consumption is highly seasonal (e.g., every Monday at 9 AM looks similar). The algorithm looks at the exact same hour from the past few weeks, averages them, and uses that as the baseline for the forecast.

**8. Explain how the data ingestion simulator works.**
*Answer:* A \`node-cron\` job acts as a ticker. Every minute (simulating real-time), it looks at active units and generates a semi-random kWh value based on a base load and the time of day (to simulate peaks and valleys). It then \`POST\`s this to the \`/energy/ingest\` endpoint, exactly mimicking how a physical ESP32 IoT device would interact via HTTP.

## Security & Validation
**9. How did you prevent "User A" from viewing "User B"'s energy data? (IDOR protection)**
*Answer:* I implemented a \`scopeToUser\` middleware. Whenever a route requires unit-specific data, the backend checks the \`unit.ownerId\` against the \`req.user.id\` decoded from the JWT. If they don't match (and the user is not an admin), it throws a 403 Forbidden error. This is enforced at the route-handler level.

**10. How do you validate incoming API data?**
*Answer:* I use \`zod\` for schema validation. Before data hits the controller logic, a middleware validates the \`req.body\` against a predefined Zod schema. If it fails, the API immediately returns a 400 Bad Request with a detailed error object, preventing malicious or malformed data from ever touching the database.

**11. How do you protect against brute-force login attacks?**
*Answer:* The backend uses \`express-rate-limit\`. The login route specifically is throttled, allowing only a certain number of failed attempts per IP window.

## Frontend & State
**12. Why didn't you use Redux for state management?**
*Answer:* Redux is meant for complex, globally shared state. In this app, most state is localized to the specific page (like fetching history or analytics). For the few global items (like authentication state and user theme), React's native \`Context API\` was more than sufficient and kept the bundle size small and the architecture simple.

**13. How did you handle charts and visual data?**
*Answer:* I used Recharts. It's a composable charting library built on React components. I format the raw data from the API into simple arrays of objects \`{ label, kwh }\` and pass them to Recharts' \`ResponsiveContainer\`, which ensures the charts scale perfectly on mobile and desktop without SVG viewBox issues.

## Testing & Maintenance
**14. I see you wrote backend tests. How do they run without affecting the real database?**
*Answer:* I use \`mongodb-memory-server\` in my Jest setup. Before tests run, it spins up an ephemeral, in-memory MongoDB instance. The backend connects to this instead of the real database. After the test suite finishes, the in-memory database is destroyed, ensuring tests are fast, isolated, and leave zero footprint.

**15. If I asked you to scale this system for 100,000 units tomorrow, what would break first and how would you fix it?**
*Answer:* The first bottleneck would be the \`node-cron\` simulator and the synchronous aggregation queries on the dashboard. To fix it, I would:
1. Move data ingestion off HTTP to a message broker like MQTT or Kafka.
2. Convert the \`EnergyRecord\` collection to a MongoDB Time Series collection.
3. Implement Redis caching for the Analytics and Forecast endpoints so they aren't computed on the fly for every dashboard load.
