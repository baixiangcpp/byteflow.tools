export const SAMPLE_INPUT = `services:
  api:
    image: node:20
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
  worker:
    build: .
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: node:20
`

