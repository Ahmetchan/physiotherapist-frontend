const About = ({ aboutContent }) => {
  return (
    <div className="row justify-content-center" style={{ marginTop: 0 }}>
      <div className="col-12 d-flex justify-content-center">
        <div style={{ maxWidth: 800, width: '100%' }}>
          <h2 className="text-center mb-4">Hakkımda</h2>
          <div className="card" style={{ minHeight: 400, width: '100%' }}>
            <div className="card-body about-content">
              <div dangerouslySetInnerHTML={{ __html: aboutContent || '' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 