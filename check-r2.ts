import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ACCOUNT_ID = "059b88471a81c454f0d235d85176131d";
const ACCESS_KEY_ID = "e27ce074c2c874bcdf299fe2144d9990";
const SECRET_ACCESS_KEY = "d8ff389ec27c8c8948120ca09118ebc81599593d3098ebb4ad7b0f1b4a345f6e";
const BUCKET = "g-matrix";

async function check() {
    console.log("Checking EU Endpoint PutObject...");
    const s3Eu = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
      // forcePathStyle: true,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });

    try {
        await s3Eu.send(new PutObjectCommand({ Bucket: BUCKET, Key: "test.txt", Body: "hello" }));
        console.log("EU PutObject Success!");
    } catch (e) {
        console.log("EU Error:", e.name, e.message);
    }
    
    console.log("Checking EU Endpoint PutObject WITH forcePathStyle...");
    const s3EuForce = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });

    try {
        await s3EuForce.send(new PutObjectCommand({ Bucket: BUCKET, Key: "test.txt", Body: "hello" }));
        console.log("EU (forcePathStyle) PutObject Success!");
    } catch (e) {
        console.log("EU (forcePathStyle) Error:", e.name, e.message);
    }

    console.log("\nChecking Global Endpoint PutObject...");
    const s3Global = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      // forcePathStyle: true,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });

    try {
        await s3Global.send(new PutObjectCommand({ Bucket: BUCKET, Key: "test.txt", Body: "hello" }));
        console.log("Global PutObject Success!");
    } catch (e) {
        console.log("Global Error:", e.name, e.message);
    }
}

check();
