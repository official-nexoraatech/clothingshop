import { customerJourneys, adminJourneys, employeeJourneys, roleSections } from '../../data/mockData';

export default function UserJourneysPage() {
  return (
    <div className="container section-block">
      <p className="eyebrow">User journeys</p>
      <h1>Role-based journeys</h1>

      <div className="journey-block">
        <h3>Customer journey</h3>
        <div className="stepper compact">
          {customerJourneys.map((step, index) => (
            <div key={step} className="step-node">
              <span>{index + 1}</span>
              <strong>{step}</strong>
              {index < customerJourneys.length - 1 && <small>↓</small>}
            </div>
          ))}
        </div>
      </div>

      <div className="journey-block">
        <h3>Admin journey</h3>
        <div className="stepper compact">
          {adminJourneys.map((step, index) => (
            <div key={step} className="step-node">
              <span>{index + 1}</span>
              <strong>{step}</strong>
              {index < adminJourneys.length - 1 && <small>↓</small>}
            </div>
          ))}
        </div>
      </div>

      <div className="journey-block">
        <h3>Employee journey</h3>
        <div className="stepper compact">
          {employeeJourneys.map((step, index) => (
            <div key={step} className="step-node">
              <span>{index + 1}</span>
              <strong>{step}</strong>
              {index < employeeJourneys.length - 1 && <small>↓</small>}
            </div>
          ))}
        </div>
      </div>

      <div className="role-grid">
        {roleSections.map((role) => (
          <div key={role.title} className="role-card">
            <h3>{role.title}</h3>
            <ul>
              {role.responsibilities.map((item) => <li key={item}>{item}</li>)}
            </ul>
            {role.limited && <span className="limited-tag">Limited access</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
