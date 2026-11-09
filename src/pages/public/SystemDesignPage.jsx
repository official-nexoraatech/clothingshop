import { systemModules } from '../../data/mockData';

export default function SystemDesignPage() {
  return (
    <div className="container section-block">
      <p className="eyebrow">System architecture</p>
      <h1>Phase 2 system design</h1>
      <div className="architecture-flow">
        <div className="flow-box">React Frontend</div>
        <span className="flow-arrow">↓</span>
        <div className="flow-box">React Router</div>
        <span className="flow-arrow">↓</span>
        <div className="flow-box">State Management</div>
        <span className="flow-arrow">↓</span>
        <div className="flow-box">API Service Layer</div>
        <span className="flow-arrow">↓</span>
        <div className="flow-box">Express/Node REST API</div>
        <span className="flow-arrow">↓</span>
        <div className="flow-box">MongoDB</div>
      </div>

      <div className="module-grid">
        {systemModules.map((module) => (
          <div key={module} className="module-card">{module}</div>
        ))}
      </div>

      <div className="supporting-grid">
        <div className="info-card"><h4>JWT</h4><p>Implemented authentication and role permissions</p></div>
        <div className="info-card"><h4>Cloudinary</h4><p>Media management</p></div>
        <div className="info-card"><h4>Nodemailer</h4><p>Email workflows</p></div>
        <div className="info-card"><h4>Cash on Delivery</h4><p>Payment collection and refund records; online gateway is optional and not enabled.</p></div>
        <div className="info-card"><h4>Database analytics</h4><p>React charts and CSV reports from live API data</p></div>
      </div>
    </div>
  );
}
