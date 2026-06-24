export const SAMPLE_INPUT = JSON.stringify(
    {
        keys: [
            {
                kty: "RSA",
                kid: "sample-rsa-key",
                use: "sig",
                alg: "RS256",
                n: "sXch3d8bVw1M43zTj2aX8aUyo7K9g43uOaT8gGb-3X1YjUd3LfFLbB3wE4tKJ4_TlKqN2uNQmM0tO1rV5q0H1w",
                e: "AQAB",
            },
        ],
    },
    null,
    2,
)

export const SAMPLE_JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6InNhbXBsZS1yc2Eta2V5In0.eyJzdWIiOiJ1c2VyXzEyMyIsImF1ZCI6ImFwaSIsImV4cCI6MTg5MzQ1NjAwMH0.signature"

