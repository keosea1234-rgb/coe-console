import { Card } from '../../../components/common/Card';
import { AssessmentFlag, FormSection } from '../../../components/form/FormPrimitives';

interface AssessmentFlagsSectionProps {
  shouldCostModeling: boolean;
  riskAssessment: boolean;
  esgAssessment: boolean;
  onShouldCostModelingChange: (value: boolean) => void;
  onRiskAssessmentChange: (value: boolean) => void;
  onEsgAssessmentChange: (value: boolean) => void;
}

export function AssessmentFlagsSection({
  shouldCostModeling,
  riskAssessment,
  esgAssessment,
  onShouldCostModelingChange,
  onRiskAssessmentChange,
  onEsgAssessmentChange,
}: AssessmentFlagsSectionProps) {
  return (
    <Card>
      <FormSection title="Assessment flags">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AssessmentFlag
            checked={shouldCostModeling}
            onChange={onShouldCostModelingChange}
            label="Yes, I would like Should Cost modelling support for this event"
            description="The CoE will build a cost breakdown model to establish an independent price anchor before the event. The flag follows the event into the register."
          />
          <AssessmentFlag
            checked={riskAssessment}
            onChange={onRiskAssessmentChange}
            label="Yes, request a supplier & supply-risk assessment for this event"
            description="The CoE will screen financial health, geographic exposure, single-source dependency and continuity risk before award."
          />
          <AssessmentFlag
            checked={esgAssessment}
            onChange={onEsgAssessmentChange}
            label="Yes, request an ESG assessment for this event"
            description="The CoE will screen suppliers on emissions, labour, human-rights and governance criteria for the award recommendation."
          />
        </div>
      </FormSection>
    </Card>
  );
}
