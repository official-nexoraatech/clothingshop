import { databaseCollections } from '../../data/mockData';

export default function DatabasePlanPage() {
  return (
    <div className="container section-block">
      <p className="eyebrow">Database planning</p>
      <h1>MongoDB collection design</h1>
      <div className="database-grid">
        {databaseCollections.map((collection) => (
          <div key={collection.name} className="db-card">
            <h3>{collection.name}</h3>
            <p><strong>Purpose:</strong> {collection.purpose}</p>
            <div className="field-list">
              {collection.fields.map((field) => <span key={field}>{field}</span>)}
            </div>
            <p><strong>Related:</strong> {collection.related.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
