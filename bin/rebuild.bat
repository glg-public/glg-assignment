docker compose --profile dev down
docker compose --profile setup down
docker image rm glg-sse-interview-app -f
docker image rm glg-sse-interview-pipeline -f
docker volume rm software-support-engineer-interview_dynamodb_data -f
docker volume rm software-support-engineer-interview_sqs_data -f
