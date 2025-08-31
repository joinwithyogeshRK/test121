import React from 'react';
import { Star } from 'lucide-react';
import { Review } from '../types';
import { Badge } from './ui/badge';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-neutral-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-card shadow-card p-6 border border-neutral-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-medium text-sm">
              {review.user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-neutral-900">
              {review.user?.full_name || 'Anonymous User'}
            </h4>
            <p className="text-sm text-neutral-600">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        {review.verified_purchase && (
          <Badge className="bg-success-100 text-success-700 hover:bg-success-100">
            Verified Purchase
          </Badge>
        )}
      </div>

      <div className="flex items-center space-x-1 mb-3">
        {renderStars(review.rating)}
        <span className="text-sm text-neutral-600 ml-2">
          {review.rating} out of 5
        </span>
      </div>

      {review.title && (
        <h5 className="font-medium text-neutral-900 mb-2">
          {review.title}
        </h5>
      )}

      {review.comment && (
        <p className="text-neutral-700 leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
};

export default ReviewCard;