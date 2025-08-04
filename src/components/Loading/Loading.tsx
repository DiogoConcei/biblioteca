import './Loading.scss';
import { Radius } from 'lucide-react';

export default function Loading() {
  return (
    <div className="loadingWrapper">
      <Radius className="spinner" />
    </div>
  );
}
