import { useState } from 'react';

interface CursorManualInputProps {
  onSubmit: (data: { todayCost: number; monthlyCost: number }) => void;
  currentData?: { todayCost: number; monthlyCost: number };
}

export default function CursorManualInput({ onSubmit, currentData }: CursorManualInputProps) {
  const [todayCost, setTodayCost] = useState(currentData?.todayCost?.toString() || '');
  const [monthlyCost, setMonthlyCost] = useState(currentData?.monthlyCost?.toString() || '');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      todayCost: parseFloat(todayCost) || 0,
      monthlyCost: parseFloat(monthlyCost) || 0,
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
      {/* 标题和说明 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Cursor 使用量录入
          </h3>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {showHelp ? '隐藏' : '如何查看？'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          由于 Cursor API 未公开，请手动输入使用量数据
        </p>
      </div>

      {/* 帮助说明 */}
      {showHelp && (
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
            <span className="mr-2">📖</span>
            查看 Cursor 使用量的步骤
          </h4>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex">
              <span className="font-semibold mr-2 flex-shrink-0">1.</span>
              <span>打开 Cursor IDE，点击右上角的账户图标</span>
            </li>
            <li className="flex">
              <span className="font-semibold mr-2 flex-shrink-0">2.</span>
              <span>选择 "Settings" → "Usage"</span>
            </li>
            <li className="flex">
              <span className="font-semibold mr-2 flex-shrink-0">3.</span>
              <span>查看 "Premium requests" 或 "Fast requests" 的使用数量</span>
            </li>
            <li className="flex">
              <span className="font-semibold mr-2 flex-shrink-0">4.</span>
              <span>根据您的套餐估算成本（Pro: $20/月，Business: $40/月）</span>
            </li>
          </ol>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>为什么需要手动录入？</strong><br />
              Cursor 的 API 未公开，自动读取需要用户提供 Session Token，存在安全风险。
              手动录入虽然稍显麻烦，但能确保您的账户安全。
            </p>
          </div>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 今日消耗 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            今日消耗（美元）
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={todayCost}
              onChange={(e) => setTodayCost(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            预估今天的 API 调用成本
          </p>
        </div>

        {/* 本月消耗 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            本月累计消耗（美元）
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            本月到目前为止的总消耗
          </p>
        </div>

        {/* 快速填充建议 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">💡 快速估算</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTodayCost('1.50');
                setMonthlyCost((1.50 * new Date().getDate()).toFixed(2));
              }}
              className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">轻度使用</div>
              <div className="text-gray-500">~$1.50/天</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setTodayCost('5.00');
                setMonthlyCost((5.00 * new Date().getDate()).toFixed(2));
              }}
              className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">中度使用</div>
              <div className="text-gray-500">~$5/天</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setTodayCost('10.00');
                setMonthlyCost((10.00 * new Date().getDate()).toFixed(2));
              }}
              className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">重度使用</div>
              <div className="text-gray-500">~$10/天</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setTodayCost('20.00');
                setMonthlyCost((20.00 * new Date().getDate()).toFixed(2));
              }}
              className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">极重度使用</div>
              <div className="text-gray-500">~$20/天</div>
            </button>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm"
          >
            保存数据
          </button>
          <button
            type="button"
            onClick={() => {
              setTodayCost('');
              setMonthlyCost('');
            }}
            className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-200 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            清空
          </button>
        </div>
      </form>

      {/* 当前数据显示 */}
      {currentData && (currentData.todayCost > 0 || currentData.monthlyCost > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">当前记录：</p>
          <div className="flex space-x-4 text-sm">
            <div>
              <span className="text-gray-500">今日：</span>
              <span className="font-semibold text-gray-900 ml-1">
                ${currentData.todayCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">本月：</span>
              <span className="font-semibold text-gray-900 ml-1">
                ${currentData.monthlyCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
