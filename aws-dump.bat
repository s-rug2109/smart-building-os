@echo off
REM AWS Digital Twin Environment Dump Script for Windows
REM Usage: aws-dump.bat > aws-status.txt

echo =========================================
echo AWS Digital Twin Environment Status
echo Date: %date% %time%
for /f "tokens=*" %%i in ('aws configure get region 2^>nul') do set AWS_REGION=%%i
echo Region: %AWS_REGION%
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text 2^>nul') do set AWS_ACCOUNT=%%i
echo Account: %AWS_ACCOUNT%
echo =========================================

echo.
echo === 1. IoT TwinMaker ===
echo --- Workspaces ---
aws iottwinmaker list-workspaces --output table 2>nul || echo No TwinMaker workspaces found or service not available

REM Get workspace details
for /f "tokens=*" %%w in ('aws iottwinmaker list-workspaces --query "workspaceSummaries[].workspaceId" --output text 2^>nul') do (
    if not "%%w"=="" (
        echo.
        echo --- Workspace: %%w ---
        aws iottwinmaker get-workspace --workspace-id %%w --output table 2>nul
        
        echo --- Entities in %%w ---
        aws iottwinmaker list-entities --workspace-id %%w --output table 2>nul
        
        echo --- Scenes in %%w ---
        aws iottwinmaker list-scenes --workspace-id %%w --output table 2>nul
    )
)

echo.
echo === 2. IoT SiteWise ===
echo --- Assets ---
aws iotsitewise list-assets --output table 2>nul || echo No SiteWise assets found

echo --- Asset Models ---
aws iotsitewise list-asset-models --output table 2>nul || echo No SiteWise asset models found

echo.
echo === 3. DynamoDB Tables ===
echo --- All Tables ---
aws dynamodb list-tables --output table 2>nul || echo No DynamoDB tables found

echo --- Building/Twin Related Tables ---
for /f "tokens=*" %%t in ('aws dynamodb list-tables --query "TableNames[?contains(@, 'bop') || contains(@, 'building') || contains(@, 'twin')]" --output text 2^>nul') do (
    if not "%%t"=="" (
        echo.
        echo --- Table: %%t ---
        aws dynamodb describe-table --table-name %%t --output table 2>nul
    )
)

echo.
echo === 4. Lambda Functions ===
echo --- All Functions ---
aws lambda list-functions --query "Functions[].{Name:FunctionName,Runtime:Runtime}" --output table 2>nul || echo No Lambda functions found

echo.
echo === 5. API Gateway ===
echo --- REST APIs ---
aws apigateway get-rest-apis --output table 2>nul || echo No REST APIs found

echo --- WebSocket APIs ---
aws apigatewayv2 get-apis --output table 2>nul || echo No WebSocket APIs found

echo.
echo === 6. S3 Buckets ===
echo --- All Buckets ---
aws s3 ls 2>nul || echo No S3 buckets found

echo.
echo === 7. IAM Roles ===
echo --- TwinMaker/Building Related Roles ---
aws iam list-roles --query "Roles[?contains(RoleName, 'TwinMaker') || contains(RoleName, 'Building') || contains(RoleName, 'IoT')].{RoleName:RoleName,CreateDate:CreateDate}" --output table 2>nul || echo No related IAM roles found

echo.
echo =========================================
echo Environment dump completed at %date% %time%
echo =========================================