import React from 'react';
import Spreadsheet, { Matrix, CellBase } from 'react-spreadsheet';
import { Card } from '@/components/ui/card';

interface SpreadsheetViewerProps {
    data: Matrix<CellBase>;
    onChange: (data: Matrix<CellBase>) => void;
    columns?: string[];
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
    data,
    onChange,
    columns,
}) => {
    return (
        <Card className="p-4 overflow-hidden">
            <div className="overflow-x-auto">
                <Spreadsheet
                    data={data}
                    onChange={onChange}
                    columnLabels={columns}
                    className="w-full"
                />
            </div>
        </Card>
    );
};
