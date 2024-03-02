FROM public.ecr.aws/lambda/nodejs:20

ARG git_commit
ARG git_branch
ARG aws_access_key_id
ARG aws_secret_access_key
ARG aws_session_token

ENV GIT_COMMIT=$git_commit
ENV GIT_BRANCH=$git_branch
ENV AWS_ACCESS_KEY_ID=$aws_access_key_id
ENV AWS_SECRET_ACCESS_KEY=$aws_secret_access_key
ENV AWS_SESSION_TOKEN=$aws_session_token

# Assumes your function is named "app.js", and there is a package.json file in the app directory 
RUN mkdir ${LAMBDA_TASK_ROOT}/app
RUN mkdir ${LAMBDA_TASK_ROOT}/my-file-core-sdk-pkg
COPY ./package.json  ${LAMBDA_TASK_ROOT}/app
COPY ./prisma  ${LAMBDA_TASK_ROOT}/app/prisma
COPY ./dist  ${LAMBDA_TASK_ROOT}/app
COPY ./myfile-core-sdk-0.1.0.tgz  ${LAMBDA_TASK_ROOT}/my-file-core-sdk-pkg

RUN ls -al
RUN ls -al ${LAMBDA_TASK_ROOT}/app
RUN ls -al ${LAMBDA_TASK_ROOT}/my-file-core-sdk-pkg
# RUN mkdir -p /opt/lib && cp -a ${LAMBDA_TASK_ROOT}/lib/. /opt/lib

# Install OS software



RUN dnf -y install openssl openssl-devel openssl-libs
WORKDIR ${LAMBDA_TASK_ROOT}/app
RUN npm install
# RUN npx prisma migrate deploy --auto-approve &> migrate-log.txt
RUN npx prisma version

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "lambda-job-creator.handler" ] 
# CMD [ "/bin/bash", "-c", "npx prisma migrate deploy --auto-approve &> migrate-log.txt;lambda-job-creator.handler" ] 


#18 [14/14] RUN npx prisma version
#18 sha256:1f80171ad177d9facbdedcee543a3af4b31e7c0cbd3b3219e631479f2ac5bb1e
#18 13.71 prisma                  : 5.9.0
#18 13.71 @prisma/client          : 5.9.0
#18 13.71 Computed binaryTarget   : rhel-openssl-3.0.x
#18 13.71 Operating System        : linux
#18 13.71 Architecture            : x64
#18 13.71 Node.js                 : v20.11.0
#18 13.71 Query Engine (Node-API) : libquery-engine 23fdc5965b1e05fc54e5f26ed3de66776b93de64 (at node_modules/@prisma/engines/libquery_engine-rhel-openssl-3.0.x.so.node)
#18 13.71 Schema Engine           : schema-engine-cli 23fdc5965b1e05fc54e5f26ed3de66776b93de64 (at node_modules/@prisma/engines/schema-engine-rhel-openssl-3.0.x)
#18 13.71 Schema Wasm             : @prisma/prisma-schema-wasm 5.9.0-32.23fdc5965b1e05fc54e5f26ed3de66776b93de64
#18 13.71 Default Engines Hash    : 23fdc5965b1e05fc54e5f26ed3de66776b93de64
#18 13.71 Studio                  : 0.497.0
#18 DONE 14.2s