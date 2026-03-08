import type { SecurityIssue } from '../../../../src/types';

interface IssueItemProps {
  issue: SecurityIssue;
}

export default function IssueItem({ issue }: IssueItemProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return 'ℹ️';
    }
  };

  const severityColor = getSeverityColor(issue.severity);
  const severityIcon = getSeverityIcon(issue.severity);

  return (
    <div className={`border-l-4 rounded-lg p-4 ${severityColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{severityIcon}</span>
            <span className="text-xs font-semibold uppercase tracking-wide">
              {issue.severity}
            </span>
            {issue.autoFixable && (
              <span className="px-2 py-0.5 text-xs font-medium bg-white rounded-full">
                🔧 Auto-fixable
              </span>
            )}
          </div>
          <h5 className="font-semibold text-sm mb-1">{issue.title}</h5>
          <p className="text-sm opacity-90 mb-2">{issue.description}</p>

          {issue.recommendation && (
            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
              <span className="font-medium">💡 Recommendation:</span>{' '}
              {issue.recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
