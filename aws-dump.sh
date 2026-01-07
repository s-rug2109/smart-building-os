#!/bin/bash

# AWS Digital Twin Environment Dump Script
# Usage: ./aws-dump.sh > aws-status.txt

echo "========================================="
echo "AWS Digital Twin Environment Status"
echo "Date: $(date)"
echo "Region: $(aws configure get region)"
echo "Account: $(aws sts get-caller-identity --query Account --output text 2>/dev/null)"
echo "========================================="

echo ""
echo "=== 1. IoT TwinMaker ==="
echo "--- Workspaces ---"
aws iottwinmaker list-workspaces --output table 2>/dev/null || echo "No TwinMaker workspaces found or service not available"

# Get workspace details if any exist
WORKSPACES=$(aws iottwinmaker list-workspaces --query 'workspaceSummaries[].workspaceId' --output text 2>/dev/null)
if [ ! -z "$WORKSPACES" ]; then
    for workspace in $WORKSPACES; do
        echo ""
        echo "--- Workspace: $workspace ---"
        aws iottwinmaker get-workspace --workspace-id $workspace --output table 2>/dev/null
        
        echo "--- Entities in $workspace ---"
        aws iottwinmaker list-entities --workspace-id $workspace --output table 2>/dev/null
        
        echo "--- Scenes in $workspace ---"
        aws iottwinmaker list-scenes --workspace-id $workspace --output table 2>/dev/null
        
        echo "--- Component Types in $workspace ---"
        aws iottwinmaker list-component-types --workspace-id $workspace --output table 2>/dev/null
    done
fi

echo ""
echo "=== 2. IoT SiteWise ==="
echo "--- Assets ---"
aws iotsitewise list-assets --output table 2>/dev/null || echo "No SiteWise assets found or service not available"

echo "--- Asset Models ---"
aws iotsitewise list-asset-models --output table 2>/dev/null || echo "No SiteWise asset models found"

echo ""
echo "=== 3. IoT Core ==="
echo "--- Things ---"
aws iot list-things --output table 2>/dev/null || echo "No IoT things found"

echo "--- Thing Types ---"
aws iot list-thing-types --output table 2>/dev/null || echo "No IoT thing types found"

echo ""
echo "=== 4. DynamoDB Tables ==="
echo "--- All Tables ---"
aws dynamodb list-tables --output table 2>/dev/null || echo "No DynamoDB tables found"

# Check for building/twin related tables
echo "--- Building/Twin Related Tables ---"
TABLES=$(aws dynamodb list-tables --query 'TableNames[?contains(@, `bop`) || contains(@, `building`) || contains(@, `twin`)]' --output text 2>/dev/null)
if [ ! -z "$TABLES" ]; then
    for table in $TABLES; do
        echo ""
        echo "--- Table: $table ---"
        aws dynamodb describe-table --table-name $table --output table 2>/dev/null
    done
else
    echo "No building/twin related tables found"
fi

echo ""
echo "=== 5. Lambda Functions ==="
echo "--- All Functions ---"
aws lambda list-functions --query 'Functions[].{Name:FunctionName,Runtime:Runtime,Modified:LastModified}' --output table 2>/dev/null || echo "No Lambda functions found"

echo "--- Building/Twin Related Functions ---"
FUNCTIONS=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `bop`) || contains(FunctionName, `building`) || contains(FunctionName, `twin`)].FunctionName' --output text 2>/dev/null)
if [ ! -z "$FUNCTIONS" ]; then
    for func in $FUNCTIONS; do
        echo ""
        echo "--- Function: $func ---"
        aws lambda get-function --function-name $func --query 'Configuration.{Name:FunctionName,Runtime:Runtime,Handler:Handler,Environment:Environment}' --output table 2>/dev/null
    done
else
    echo "No building/twin related functions found"
fi

echo ""
echo "=== 6. API Gateway ==="
echo "--- REST APIs ---"
aws apigateway get-rest-apis --output table 2>/dev/null || echo "No REST APIs found"

echo "--- WebSocket APIs ---"
aws apigatewayv2 get-apis --output table 2>/dev/null || echo "No WebSocket APIs found"

echo ""
echo "=== 7. S3 Buckets ==="
echo "--- All Buckets ---"
aws s3 ls 2>/dev/null || echo "No S3 buckets found"

echo "--- Building/Twin Related Buckets ---"
aws s3 ls | grep -i -E "(bop|building|twin|3d|model)" || echo "No building/twin related buckets found"

echo ""
echo "=== 8. CloudFront Distributions ==="
aws cloudfront list-distributions --query 'DistributionList.Items[].{Id:Id,DomainName:DomainName,Status:Status}' --output table 2>/dev/null || echo "No CloudFront distributions found"

echo ""
echo "=== 9. IAM Roles ==="
echo "--- TwinMaker/Building Related Roles ---"
aws iam list-roles --query 'Roles[?contains(RoleName, `TwinMaker`) || contains(RoleName, `Building`) || contains(RoleName, `IoT`)].{RoleName:RoleName,CreateDate:CreateDate}' --output table 2>/dev/null || echo "No related IAM roles found"

echo ""
echo "=== 10. VPC Configuration ==="
echo "--- VPCs ---"
aws ec2 describe-vpcs --query 'Vpcs[].{VpcId:VpcId,CidrBlock:CidrBlock,State:State}' --output table 2>/dev/null || echo "No VPCs found"

echo ""
echo "=== 11. Security Groups ==="
echo "--- Building/IoT Related Security Groups ---"
aws ec2 describe-security-groups --query 'SecurityGroups[?contains(GroupName, `building`) || contains(GroupName, `iot`) || contains(GroupName, `twin`)].{GroupId:GroupId,GroupName:GroupName}' --output table 2>/dev/null || echo "No related security groups found"

echo ""
echo "=== 12. CloudWatch Logs ==="
echo "--- Log Groups ---"
aws logs describe-log-groups --query 'logGroups[?contains(logGroupName, `building`) || contains(logGroupName, `twin`) || contains(logGroupName, `bop`)].{LogGroupName:logGroupName,CreationTime:creationTime}' --output table 2>/dev/null || echo "No related log groups found"

echo ""
echo "========================================="
echo "Environment dump completed at $(date)"
echo "========================================="