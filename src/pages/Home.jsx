import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center">
      <h1 className="display-4 mb-4">Fizyomen Randevu Sistemi</h1>
      <p className="lead mb-4">
        Online randevu sistemimiz ile kolayca randevu alabilir ve randevunuzu takip edebilirsiniz.
      </p>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Randevu Al</h5>
              <p className="card-text">
                Hızlı ve kolay bir şekilde randevu oluşturun. Randevunuzu takip edin.
              </p>
              <Link to="/randevu" className="btn btn-primary">
                Randevu Oluştur
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 