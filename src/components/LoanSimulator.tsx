import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function LoanSimulator() {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(240); // 20 years in months
  const [simulationType, setSimulationType] = useState("home");
  const [showComparison, setShowComparison] = useState(false);

  const loanCalculation = useQuery(api.simulator.calculateLoan, {
    loanAmount,
    interestRate,
    tenure,
  });

  const userSimulations = useQuery(api.simulator.getUserSimulations);
  const saveLoanSimulation = useMutation(api.simulator.saveLoanSimulation);

  const handleSaveSimulation = async () => {
    if (!loanCalculation) return;

    try {
      await saveLoanSimulation({
        loanAmount,
        interestRate,
        tenure,
        emiAmount: loanCalculation.emiAmount,
        totalInterest: loanCalculation.totalInterest,
        totalAmount: loanCalculation.totalAmount,
        simulationType,
      });
      toast.success("Simulation saved! +25 coins earned!");
    } catch (error) {
      toast.error("Failed to save simulation");
    }
  };

  const loanTypes = [
    { id: "home", name: "Home Loan", icon: "🏠", rate: 8.5 },
    { id: "car", name: "Car Loan", icon: "🚗", rate: 10.5 },
    { id: "personal", name: "Personal Loan", icon: "👤", rate: 12.0 },
    { id: "education", name: "Education Loan", icon: "🎓", rate: 9.0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loan & EMI Simulator</h2>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showComparison ? "Hide" : "Show"} Comparison
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Loan Details</h3>
          
          {/* Loan Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {loanTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSimulationType(type.id);
                    setInterestRate(type.rate);
                  }}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    simulationType === type.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs text-gray-500">{type.rate}% p.a.</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Loan Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount (₹)
            </label>
            <input
              type="range"
              min="100000"
              max="10000000"
              step="50000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full mb-2"
            />
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Interest Rate */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interest Rate (% per annum)
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full mb-2"
            />
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tenure */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenure (months)
            </label>
            <input
              type="range"
              min="12"
              max="360"
              step="12"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full mb-2"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                {Math.round(tenure / 12)} years
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSimulation}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Save Simulation (+25 coins)
          </button>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {loanCalculation && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Calculation Results</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{loanCalculation.emiAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Monthly EMI</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{loanCalculation.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">Total Amount</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    ₹{loanCalculation.totalInterest.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700">Total Interest</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {((loanCalculation.totalInterest / loanAmount) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-700">Interest Ratio</div>
                </div>
              </div>

              {/* Amortization Schedule Preview */}
              <div>
                <h4 className="font-medium mb-3">First Year Payment Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Month</th>
                        <th className="text-right py-2">EMI</th>
                        <th className="text-right py-2">Principal</th>
                        <th className="text-right py-2">Interest</th>
                        <th className="text-right py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanCalculation.schedule.slice(0, 6).map((payment) => (
                        <tr key={payment.month} className="border-b">
                          <td className="py-2">{payment.month}</td>
                          <td className="text-right py-2">₹{payment.emi.toLocaleString()}</td>
                          <td className="text-right py-2">₹{payment.principal.toLocaleString()}</td>
                          <td className="text-right py-2">₹{payment.interest.toLocaleString()}</td>
                          <td className="text-right py-2">₹{payment.balance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Loan Comparison */}
          {showComparison && (
            <LoanComparison loanAmount={loanAmount} />
          )}
        </div>
      </div>

      {/* Previous Simulations */}
      {userSimulations && userSimulations.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Your Previous Simulations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-right py-2">Tenure</th>
                  <th className="text-right py-2">EMI</th>
                  <th className="text-right py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {userSimulations.slice(0, 5).map((sim) => (
                  <tr key={sim._id} className="border-b">
                    <td className="py-2 capitalize">{sim.simulationType}</td>
                    <td className="text-right py-2">₹{sim.loanAmount.toLocaleString()}</td>
                    <td className="text-right py-2">{sim.interestRate}%</td>
                    <td className="text-right py-2">{Math.round(sim.tenure / 12)}y</td>
                    <td className="text-right py-2">₹{sim.emiAmount.toLocaleString()}</td>
                    <td className="text-right py-2">
                      {new Date(sim.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LoanComparison({ loanAmount }: { loanAmount: number }) {
  const comparisonOptions = [
    { name: "Bank A", interestRate: 8.5, tenure: 240 },
    { name: "Bank B", interestRate: 9.0, tenure: 240 },
    { name: "Bank C", interestRate: 8.2, tenure: 240 },
    { name: "NBFC", interestRate: 10.5, tenure: 240 },
  ];

  const comparison = useQuery(api.simulator.compareLoanOptions, {
    loanAmount,
    options: comparisonOptions,
  });

  if (!comparison) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Loan Comparison</h3>
      <div className="space-y-3">
        {comparison.map((option, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{option.name}</h4>
              <div className="text-sm text-gray-600">{option.interestRate}% p.a.</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">EMI</div>
                <div className="font-medium">₹{option.emiAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Total Interest</div>
                <div className="font-medium">₹{option.totalInterest.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">You Save</div>
                <div className="font-medium text-green-600">
                  ₹{option.savings.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
