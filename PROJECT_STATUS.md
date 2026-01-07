# Smart Building OS - Project Status

## 📊 Project Overview
- **Version**: 1.2.0
- **Last Updated**: 2025-01-07
- **Status**: Active Development
- **Type**: IoT Monitoring Dashboard with Digital Twin Integration

## 🏗️ Architecture
```
Frontend (React) ↔ API Gateway ↔ Lambda ↔ DynamoDB
                                    ↓
                              IoT TwinMaker
                                    ↓
                              S3 (3D Models)
```

## ✅ Completed Features
- [x] Real-time monitoring dashboard (MUI v6)
- [x] WebSocket live data streaming
- [x] Time series charts (Recharts)
- [x] Alert system with thresholds
- [x] Responsive card-based UI
- [x] AWS TwinMaker workspace setup
- [x] DynamoDB data integration

## 🚧 In Progress
- [ ] 3D Digital Twin visualization
- [ ] TwinMaker Scene Composer integration
- [ ] Three.js 3D rendering

## 📋 Planned Features
- [ ] Mobile responsive design
- [ ] User authentication (AWS Cognito)
- [ ] Historical data analysis
- [ ] Export/reporting functionality
- [ ] Multi-tenant support

## 🛠️ Technology Stack

### Frontend
- React 19.2.0
- TypeScript
- Vite (Build tool)
- MUI v6 (UI Framework)
- Zustand (State management)
- Recharts (Charts)
- Axios (HTTP client)

### Backend (AWS)
- IoT TwinMaker (Digital Twin)
- DynamoDB (Data storage)
- API Gateway (REST + WebSocket)
- Lambda (Serverless functions)
- S3 (Asset storage)
- IAM (Security)

## 🌐 AWS Resources

### IoT TwinMaker
- **Workspace ID**: `smart-building-data-model-auto-generat-twinmaker`
- **S3 Bucket**: `twinmaker-workspace-smart-building-data-model--513348750465-nrt`
- **Entities**: 100+ (rooms, sensors, lighting, HVAC)

### DynamoDB Tables
- `bop-metadata-cache`: Static topology data
- `bop-present-value`: Real-time sensor values
- `bop-websocket-subs`: WebSocket subscriptions

### API Endpoints
- **REST**: `https://dq7i2u9882.execute-api.ap-northeast-1.amazonaws.com/v1`
- **WebSocket**: `wss://373x5ueep5.execute-api.ap-northeast-1.amazonaws.com/v1`

## 📁 Project Structure
```
my-building-os/
├── src/
│   ├── components/
│   │   ├── TimeSeriesChart.tsx
│   │   ├── AlertPanel.tsx
│   │   └── DevStatusDashboard.tsx
│   ├── types.ts
│   ├── store.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Access to AWS account (513348750465)

### Installation
```bash
git clone <repository>
cd my-building-os
npm install
```

### Environment Setup
Create `.env` file:
```
VITE_API_REST_URL=https://dq7i2u9882.execute-api.ap-northeast-1.amazonaws.com/v1
VITE_API_WS_URL=wss://373x5ueep5.execute-api.ap-northeast-1.amazonaws.com/v1
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 🔧 Development Commands

### AWS Status Check
```bash
# Check TwinMaker workspace
aws iottwinmaker list-workspaces

# Check entities
aws iottwinmaker list-entities --workspace-id smart-building-data-model-auto-generat-twinmaker

# Check DynamoDB tables
aws dynamodb list-tables
```

### Local Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 Current Metrics
- **Entities**: 100+ IoT devices
- **Rooms**: 15+ monitored spaces
- **Data Points**: Temperature, lighting, HVAC status
- **Update Frequency**: Real-time via WebSocket
- **Chart History**: 24 hours

## 🎯 Next Milestones

### Week 1-2: 3D Visualization
- [ ] Create basic 3D building model
- [ ] Integrate Three.js with React
- [ ] Connect TwinMaker scenes

### Week 3-4: Mobile Optimization
- [ ] Responsive design implementation
- [ ] Touch-friendly interactions
- [ ] Performance optimization

### Month 2: Advanced Features
- [ ] User authentication
- [ ] Role-based access
- [ ] Advanced analytics

## 🐛 Known Issues
- None currently reported

## 📞 Contact & Support
- **Developer**: Internal Team
- **AWS Account**: 513348750465
- **Region**: ap-northeast-1 (Tokyo)

---
*Last updated: 2025-01-07*