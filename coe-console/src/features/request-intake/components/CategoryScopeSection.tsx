import { Card } from '../../../components/common/Card';
import { FilterSelect, SegmentedControl } from '../../../components/common/primitives';
import { FieldGrid, FormField, FormSection } from '../../../components/form/FormPrimitives';
import { CATEGORIES } from '../../../domain/categories';
import type { Directness, RequestValidationErrors } from '../../../domain/requestIntake';

interface CategoryScopeSectionProps {
  complete: boolean;
  directness: Directness;
  category: string;
  subcategory: string;
  subcategoryOptions: string[];
  errors: RequestValidationErrors;
  onDirectnessChange: (value: Directness) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
}

export function CategoryScopeSection({
  complete,
  directness,
  category,
  subcategory,
  subcategoryOptions,
  errors,
  onDirectnessChange,
  onCategoryChange,
  onSubcategoryChange,
}: CategoryScopeSectionProps) {
  return (
    <Card>
      <FormSection title="Category & effectiveness" complete={complete}>
        <FieldGrid>
          <FormField label="Direct / Indirect" required>
            <SegmentedControl
              options={[
                { value: 'Direct' as Directness, label: 'Direct' },
                { value: 'Indirect' as Directness, label: 'Indirect' },
              ]}
              value={directness}
              onChange={onDirectnessChange}
              fullWidth
            />
          </FormField>

          <FormField label="Category" required error={errors.category}>
            <FilterSelect
              value={category}
              onChange={onCategoryChange}
              placeholder="Select..."
              options={CATEGORIES.map((item) => ({ value: item.name, label: item.name }))}
              style={{ width: '100%' }}
            />
          </FormField>

          <FormField label="Subcategory" required error={errors.subcategory}>
            <FilterSelect
              value={subcategory}
              onChange={onSubcategoryChange}
              placeholder={category ? 'Select...' : 'Choose category first'}
              disabled={!category}
              options={subcategoryOptions.map((item) => ({ value: item, label: item }))}
              style={{ width: '100%' }}
            />
          </FormField>
        </FieldGrid>
      </FormSection>
    </Card>
  );
}
