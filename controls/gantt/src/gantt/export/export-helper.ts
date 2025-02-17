import { TaskFieldsModel } from './../models/task-fields-model.d';
import { PdfFontFamily, PdfTextWebLink, PdfImage } from '@syncfusion/ej2-pdf-export';
import { PdfStringFormat, PdfPageCountField, PdfPageNumberField } from '@syncfusion/ej2-pdf-export';
import { PdfPageTemplateElement, RectangleF, PdfCompositeField, PointF } from '@syncfusion/ej2-pdf-export';
import { PdfVerticalAlignment, PdfTextAlignment, PdfFont, PdfStandardFont, PdfTrueTypeFont } from '@syncfusion/ej2-pdf-export';
import { PdfFontStyle, PdfColor, PdfPen, PdfBrush, PdfSolidBrush, PdfDocument, SizeF, PdfBitmap,PdfGridCell  } from '@syncfusion/ej2-pdf-export';
import { PdfTreeGridColumn, PdfTreeGridRow, PdfTreeGridCell, PdfBorders, PdfPaddings } from './pdf-base/index';
import { ColumnModel } from './../models/column';
import { PdfPageNumberType, PdfDashStyle } from '../base/enum';
import { PdfGantt } from './pdf-gantt';
import {
    IGanttData, PdfExportProperties, PdfQueryCellInfoEventArgs,
    ITaskData, IGanttStyle, IConnectorLineObject, PdfGanttCellStyle, ITaskbarStyle, PdfColumnHeaderQueryCellInfoEventArgs,
    PdfQueryTaskbarInfoEventArgs,
    ZoomTimelineSettings, PdfHeader, PdfHeaderFooterContent
} from './../base/interface';
import { Gantt } from './../base/gantt';
import { isNullOrUndefined, DateFormatOptions, Internationalization, getValue, extend } from '@syncfusion/ej2-base';
import { getForeignData, ValueFormatter } from '@syncfusion/ej2-grids';
import { pixelToPoint, isScheduledTask, pointToPixel } from '../base/utils';
import { Timeline } from '../renderer/timeline';
import { PdfGanttTaskbarCollection } from './pdf-taskbar';
import { PdfGanttPredecessor } from './pdf-connector-line';


/**
 * @hidden
 * `ExportHelper` for `PdfExport` & `ExcelExport`
 */
export class ExportHelper {
    private parent: Gantt;
    private flatData: IGanttData[];
    public exportProps: PdfExportProperties;
    private gantt: PdfGantt;
    private rowIndex: number;
    private colIndex: number;
    private row: PdfTreeGridRow;
    private columns: ColumnModel[];
    private ganttStyle: IGanttStyle;
    private pdfDoc: PdfDocument;
    private exportValueFormatter: ExportValueFormatter;
    private totalColumnWidth: number = 0;
    public beforeSinglePageExport: Object = {};
    public baselineHeight: number = 8;
    public baselineTop: number;
    public constructor(parent: Gantt) {
        this.parent = parent;
    }

    public processToFit(): void {
        this.beforeSinglePageExport['zoomingProjectStartDate'] = this.parent.zoomingProjectStartDate;
        this.beforeSinglePageExport['zoomingProjectEndDate'] = this.parent.zoomingProjectEndDate;
        this.beforeSinglePageExport['cloneProjectStartDate'] = this.parent.cloneProjectStartDate;
        this.beforeSinglePageExport['cloneProjectEndDate'] = this.parent.cloneProjectEndDate;
        this.beforeSinglePageExport['customTimelineSettings'] = extend({}, this.parent.timelineModule.customTimelineSettings, null, true);
        this.beforeSinglePageExport['isTimelineRoundOff'] = this.parent.isTimelineRoundOff;
        this.beforeSinglePageExport['topTier'] = this.parent.timelineModule.topTier;
        this.beforeSinglePageExport['topTierCellWidth'] = this.parent.timelineModule.topTierCellWidth;
        this.beforeSinglePageExport['topTierCollection'] = this.parent.timelineModule.topTierCollection;
        this.beforeSinglePageExport['bottomTier'] = this.parent.timelineModule.bottomTier;
        this.beforeSinglePageExport['bottomTierCellWidth'] = this.parent.timelineModule.bottomTierCellWidth;
        this.beforeSinglePageExport['bottomTierCollection'] = this.parent.timelineModule.bottomTierCollection;
        this.beforeSinglePageExport['totalTimelineWidth'] = this.parent.timelineModule.totalTimelineWidth;
        this.beforeSinglePageExport['timelineStartDate'] = this.parent.timelineModule.timelineStartDate;
        this.beforeSinglePageExport['timelineEndDate'] = this.parent.timelineModule.timelineEndDate;
        this.beforeSinglePageExport['timelineRoundOffEndDate'] = this.parent.timelineModule.timelineRoundOffEndDate;
        this.beforeSinglePageExport['perDayWidth'] = this.parent.perDayWidth;
        this.beforeSinglePageExport['updatedConnectorLineCollection'] = extend([], this.parent.updatedConnectorLineCollection, null, true);
        this.parent.timelineModule.isZoomToFit = true;
        this.parent.timelineModule.isZooming = false;
        if (!this.parent.zoomingProjectStartDate) {
            this.parent.zoomingProjectStartDate = this.parent.cloneProjectStartDate;
            this.parent.zoomingProjectEndDate = this.parent.cloneProjectEndDate;
        }
        if (this.parent.zoomingProjectStartDate > this.parent.cloneProjectStartDate) {
            this.parent.cloneProjectStartDate = new Date(this.parent.allowUnscheduledTasks ? this.parent.zoomingProjectStartDate : this.parent.cloneProjectStartDate);
        }
        this.parent.dataOperation.calculateProjectDates();
        const timeDifference: number = (this.parent.cloneProjectEndDate.getTime() - this.parent.cloneProjectStartDate.getTime());
        const totalDays: number = (timeDifference / (1000 * 3600 * 24));
        let chartsideWidth: number;
        let gridWidth: number;
        if (this.exportProps.fitToWidthSettings.gridWidth) {
            gridWidth = parseInt(this.exportProps.fitToWidthSettings.gridWidth.split('%')[0]);
        }
        if (this.exportProps.fitToWidthSettings.chartWidth) {
            chartsideWidth = parseInt(this.exportProps.fitToWidthSettings.chartWidth.split('%')[0]);
        }
        else {
            if (this.exportProps.fitToWidthSettings.gridWidth) {
                chartsideWidth = 100 - gridWidth;
            }
            else {
                chartsideWidth = 70;
            }
        }
        const pdfwidth: number = (this.parent.pdfExportModule['pdfPageDimensions'].width * chartsideWidth) / 100;
        const chartWidth: number = pdfwidth;
        const perDayWidth: number = chartWidth / totalDays;
        let zoomingLevel: ZoomTimelineSettings;
        let firstValue: ZoomTimelineSettings;
        let secondValue: ZoomTimelineSettings;
        const zoomingCollections: ZoomTimelineSettings[] = [...this.parent.zoomingLevels];
        const sortedCollectons: ZoomTimelineSettings[] = zoomingCollections.sort((a: ZoomTimelineSettings, b: ZoomTimelineSettings) =>
            (!a.perDayWidth && !b.perDayWidth ? 0 : (a.perDayWidth < b.perDayWidth) ? 1 : -1));
        if (perDayWidth === 0) { // return when the Gantt chart is not in viewable state.
            return;
        }
        for (let i: number = 0; i < sortedCollectons.length; i++) {
            firstValue = sortedCollectons[i as number];
            if (i === sortedCollectons.length - 1) {
                zoomingLevel = sortedCollectons[i as number];
                break;
            } else {
                secondValue = sortedCollectons[i + 1];
            }
            if (perDayWidth >= firstValue.perDayWidth) {
                zoomingLevel = sortedCollectons[i as number];
                break;
            }
            if (perDayWidth < firstValue.perDayWidth && perDayWidth > secondValue.perDayWidth) {
                zoomingLevel = sortedCollectons[i + 1];
                break;
            }
        }
        const newTimeline: ZoomTimelineSettings = extend({}, {}, zoomingLevel, true);
        this.parent.timelineModule['roundOffDateToZoom'](this.parent.cloneProjectStartDate, true, perDayWidth, newTimeline.bottomTier.unit, zoomingLevel);
        this.parent.timelineModule['roundOffDateToZoom'](this.parent.cloneProjectEndDate, false, perDayWidth, newTimeline.bottomTier.unit, zoomingLevel);
        const numberOfCells: number = this.parent.timelineModule['calculateNumberOfTimelineCells'](newTimeline);
        const scrollHeight: number = this.parent.pdfExportModule['pdfPageDimensions'].height; //17 is horizontal scrollbar width
        const contentHeight: number = this.parent.pdfExportModule['pdfPageDimensions'].height;
        const emptySpace: number = contentHeight <= scrollHeight ? 0 : 17;
        newTimeline.timelineUnitSize = Math.abs((chartWidth - emptySpace)) / numberOfCells;
        this.parent.timelineModule['changeTimelineSettings'](newTimeline);
        this.parent.timelineModule.isZoomToFit = false;
        this.parent.timelineModule.isZooming = false;
    }
    /**
     * @param {IGanttData[]} data .
     * @param {PdfGantt} gantt .
     * @param {PdfExportProperties} props .
     * @returns {void} .
     * @private
     */
    public processGridExport(data: IGanttData[], gantt: PdfGantt, props: PdfExportProperties): void {
        this.flatData = data;
        this.gantt = gantt;
        this.exportValueFormatter = new ExportValueFormatter(this.parent.locale);
        this.exportProps = props;
        this.rowIndex = 0;
        this.colIndex = 0;
        this.columns = this.parent.treeGrid.columns as ColumnModel[];
        this.gantt.treeColumnIndex = this.parent.treeColumnIndex;
        this.gantt.rowHeight = pixelToPoint(this.parent.rowHeight);
        this.gantt.style.cellPadding.left = 0;
        this.gantt.style.cellPadding.right = 0;
        this.ganttStyle = this.gantt.ganttStyle;
        this.gantt.borderColor = this.ganttStyle.chartGridLineColor;
        this.parent.pdfExportModule.isPdfExport = true;
        if (this.exportProps.fitToWidthSettings && this.exportProps.fitToWidthSettings.isFitToWidth) {
            this.processToFit();
        }
        this.processHeaderContent();
        this.processGanttContent();
        this.processTimeline();
        this.processTaskbar();
        this.processPredecessor();
        this.parent.pdfExportModule.isPdfExport = false;
    }

    private processHeaderContent(): void {
        this.rowIndex++;
        this.row = this.gantt.rows.addRow();
        let index: number = 0;
        this.columns.forEach((column: ColumnModel): void => {
            if (this.isColumnVisible(column)) {
                this.processColumnHeader(column, index);
                index++;
            }
        });
    }
    private processColumnHeader(column: ColumnModel, index: number): void {
        this.gantt.columns.add(1);
        const pdfColumn: PdfTreeGridColumn = this.gantt.columns.getColumn(index);
        if (this.parent.treeColumnIndex === index) {
            pdfColumn.isTreeColumn = true;
        }
        const width: string | number = parseInt(column.width as string, 10);
        pdfColumn.width = pixelToPoint(width);
        this.totalColumnWidth += pdfColumn.width;
        pdfColumn.headerText = column.headerText;
        pdfColumn.field = column.field;
        const cell: PdfTreeGridCell = this.row.cells.getCell(index);
        cell.value = column.headerText;
        cell.isHeaderCell = true;
        const treeGridHeaderHeight: number = this.parent.timelineModule.isSingleTier ? 45 : 60;
        this.copyStyles(this.ganttStyle.columnHeader, cell, false);
        this.row.height = pixelToPoint(treeGridHeaderHeight);
        if (column.headerTextAlign) {
            cell.style.format.alignment = PdfTextAlignment[column.headerTextAlign];
        }
        const args: PdfColumnHeaderQueryCellInfoEventArgs = {
            cell: cell,
            style: cell.style,
            value: cell.value,
            column: column
        };
        if (this.parent.pdfColumnHeaderQueryCellInfo) {
            this.parent.trigger('pdfColumnHeaderQueryCellInfo', args);
        }
        cell.value = args.value;
    }

    private isColumnVisible(column: ColumnModel): boolean {
        const visibleColumn: boolean = column.visible || this.exportProps.includeHiddenColumn;
        return (visibleColumn);
    }

    private processGanttContent(): void {
        if (this.flatData.length === 0) {
            this.renderEmptyGantt();
        } else {
            let flatData: IGanttData[];
            flatData = this.flatData;
            flatData.forEach((data: IGanttData) => {
                this.row = this.gantt.rows.addRow();
                if (data.hasChildRecords) {
                    this.gantt.rows.getRow(this.rowIndex).isParentRow = true;
                    this.processRecordRow(data);
                } else {
                    this.processRecordRow(data);
                }
                if (this.exportProps.fitToWidthSettings && this.exportProps.fitToWidthSettings.isFitToWidth) {
                    this.row.height = 33.33;
                }
                this.rowIndex++;
            });
        }
    }
    /**
     * Method for processing the timeline details
     *
     * @returns {void} .
     */
    private processTimeline(): void {
        if (this.parent.enableTimelineVirtualization) {
            this.parent.timelineModule.createTimelineSeries();
        }
        const timelineSettings: Timeline = this.parent.timelineModule;
        this.gantt.chartHeader.topTierHeight = this.gantt.chartHeader.bottomTierHeight
            = (this.parent.timelineModule.isSingleTier ? 45 : 60 / 2);
        this.gantt.chartHeader.topTierCellWidth = timelineSettings.topTierCellWidth;
        this.gantt.chartHeader.bottomTierCellWidth = timelineSettings.bottomTierCellWidth;
        this.gantt.chartHeader.topTier = extend([], [], this.parent.enableTimelineVirtualization ? timelineSettings.pdfExportTopTierCollection : timelineSettings.topTierCollection, true) as [];
        this.gantt.chartHeader.bottomTier = extend([], [], this.parent.enableTimelineVirtualization ? timelineSettings.pdfExportBottomTierCollection : timelineSettings.bottomTierCollection, true) as [];
        if (this.exportProps && this.exportProps.fitToWidthSettings && this.exportProps.fitToWidthSettings.isFitToWidth && this.parent.enableTimelineVirtualization) {
            const tier: string = timelineSettings.topTier === 'None' ? 'bottomTier' : 'topTier';
            this.gantt.chartHeader.width = timelineSettings['calculateWidthBetweenTwoDate'](tier, timelineSettings.timelineStartDate, timelineSettings.timelineEndDate);
        }
        else {
            this.gantt.chartHeader.width = this.parent.enableTimelineVirtualization ? this.parent.timelineModule.wholeTimelineWidth : timelineSettings.totalTimelineWidth;
        }
        this.gantt.chartHeader.height = this.gantt.rows.getRow(0).height;
        this.gantt.timelineStartDate = new Date(timelineSettings.timelineStartDate.getTime());
    }
    /**
     * Method for create the predecessor collection for rendering
     *
     * @returns {void} .
     */
    private processPredecessor(): void {
        if (isNullOrUndefined(this.exportProps.showPredecessorLines) || this.exportProps.showPredecessorLines) {
            this.parent.pdfExportModule.isPdfExport = true;
            this.parent.predecessorModule.createConnectorLinesCollection();
            this.parent.updatedConnectorLineCollection.forEach((data: IConnectorLineObject) => {
                const predecessor: PdfGanttPredecessor = this.gantt.predecessor.add();
                predecessor.parentLeft = data.parentLeft;
                predecessor.childLeft = data.childLeft;
                predecessor.parentWidth = data.parentWidth;
                predecessor.childWidth = data.childWidth;
                predecessor.parentIndex = data.parentIndex;
                predecessor.childIndex = data.childIndex;
                predecessor.rowHeight = data.rowHeight;
                predecessor.type = data.type;
                predecessor.milestoneParent = data.milestoneParent;
                predecessor.milestoneChild = data.milestoneChild;
                predecessor.parentEndPoint = data.parentEndPoint;
                predecessor.lineWidth = this.parent.connectorLineWidth > 5 ? pixelToPoint(5) : pixelToPoint(this.parent.connectorLineWidth);
                if (data.isCritical) {
                    predecessor.connectorLineColor = this.ganttStyle.criticalConnectorLineColor;
                }
                else {
                    predecessor.connectorLineColor = this.ganttStyle.connectorLineColor;
                }
                this.ganttStyle.connectorLineColor = predecessor.connectorLineColor;
                this.gantt.predecessorCollection.push(predecessor);
            });
            this.parent.pdfExportModule.isPdfExport = false;
        }
    }

    private processRecordRow(data: IGanttData): void {
        this.colIndex = 0;
        this.row.level = data.level;
        this.columns.forEach((column: ColumnModel): void => {
            if (this.isColumnVisible(column)) {
                this.processRecordCell(data, column, this.row);
                this.colIndex++;
            }
        });
    }

    private processRecordCell(data: IGanttData, column: ColumnModel, row: PdfTreeGridRow): void {
        const cell: PdfTreeGridCell = row.cells.getCell(this.colIndex);
        const taskFields: TaskFieldsModel = this.parent.taskFields;
        const ganttProps: ITaskData = data.ganttProperties;
        if (column.editType === 'datepickeredit' || column.editType === 'datetimepickeredit') {
            cell.value = data[column.field];
        } else if (column.field === taskFields.duration) {
            cell.value = this.parent.getDurationString(ganttProps.duration, ganttProps.durationUnit);
        } else if (column.field === taskFields.resourceInfo) {
            cell.value = ganttProps.resourceNames;
        } else if (column.field === taskFields.work) {
            cell.value = this.parent.getWorkString(ganttProps.work, ganttProps.workUnit);
        } else {
            cell.value = !isNullOrUndefined(data[column.field]) ? data[column.field].toString() : '';
        }
        const cellValueString = !isNullOrUndefined(cell.value) ? cell.value.toString() : '';
        const cellValue: string = cellValueString;
        let value: string = !isNullOrUndefined(cellValue) ? cellValue : '';
        cell.isHeaderCell = false;
        cell.style.padding = new PdfPaddings();
        this.copyStyles(this.ganttStyle.cell, cell, row.isParentRow);
        if (this.colIndex !== this.parent.treeColumnIndex) {
            cell.style.format.alignment = PdfTextAlignment[column.textAlign];
        } else {
            cell.style.format.paragraphIndent = cell.row.level * 10;
        }
        const args: PdfQueryCellInfoEventArgs = {
            data: data,
            value: value,
            column: column,
            style: cell.style,
            cell: cell
        };
        args.value = this.exportValueFormatter.formatCellValue(args);
        if (this.parent.pdfQueryCellInfo) {
            this.parent.trigger('pdfQueryCellInfo', args);
        }
        if (!isNullOrUndefined(args.image) && !isNullOrUndefined(args.image.base64)) {
            args.value = new PdfBitmap(args.image.base64);
            args.value.height = (<{ height?: number }>args.image).height || args.value.height;
            args.value.width = (<{ width?: number }>args.image).width || args.value.width;
        }
        cell.value = args.value;
        if (!isNullOrUndefined(args.hyperLink) && !isNullOrUndefined(args.hyperLink.displayText)) {
            cell.value = this.setHyperLink(args);
        }
    }
    private setHyperLink(args: PdfQueryCellInfoEventArgs): PdfTextWebLink {
        // create the Text Web Link
        const textLink: PdfTextWebLink = new PdfTextWebLink();
        // set the hyperlink
        textLink.url = args.hyperLink.target;
        // set the link text
        textLink.text = args.hyperLink.displayText || args.hyperLink.target;
        // set the font
        textLink.font = new PdfStandardFont(PdfFontFamily.Helvetica, 9.75);
        // set the brush and pen for the text color
        textLink.brush = new PdfSolidBrush(new PdfColor(51, 102, 187));
        return textLink;
    }
    /**
     * Method for create the taskbar collection for rendering
     *
     * @returns {void} .
     */
    private processTaskbar(): void {
        let flatData: IGanttData[];
        flatData = this.flatData;
        flatData.forEach((data: IGanttData) => {
            const taskbar: PdfGanttTaskbarCollection = this.gantt.taskbar.add();
            const ganttProp: ITaskData = data.ganttProperties;
            taskbar.left = ganttProp.left;
            taskbar.width = ganttProp.width;
            if (taskbar.left < 0) {
                taskbar.width = taskbar.width + taskbar.left;
                taskbar.left = 0;
            }
            taskbar.progress = ganttProp.progress;
            taskbar.isScheduledTask = isScheduledTask(ganttProp);
            if (isScheduledTask) {
                if (isNullOrUndefined(ganttProp.endDate) && isNullOrUndefined(ganttProp.duration)) {
                    taskbar.unscheduledTaskBy = 'startDate';
                } else if (isNullOrUndefined(ganttProp.startDate) && isNullOrUndefined(ganttProp.duration)) {
                    taskbar.unscheduledTaskBy = 'endDate';
                } else {
                    taskbar.unscheduledTaskBy = 'duration';
                    taskbar.unscheduleStarteDate = this.parent.dateValidationModule.getValidStartDate(data.ganttProperties);
                    taskbar.unscheduleEndDate = this.parent.dateValidationModule.getValidEndDate(data.ganttProperties);
                }
            } else {
                taskbar.unscheduleStarteDate = null;
                taskbar.unscheduleEndDate = null;
            }
            taskbar.startDate = ganttProp.startDate;
            taskbar.endDate = ganttProp.endDate;
            taskbar.height = this.parent.chartRowsModule.taskBarHeight;
            if (this.parent.renderBaseline) {
                let height: number;
                if ((taskbar.height + this.baselineHeight) <= this.parent.rowHeight) {
                    height = taskbar.height;
                } else {
                    height = taskbar.height - (this.baselineHeight + 1);
                }
                taskbar.height = height;
            }
            taskbar.indicators = ganttProp.indicators;
            taskbar.autoStartDate = ganttProp.autoStartDate;
            taskbar.autoEndDate = ganttProp.autoEndDate;
            taskbar.isAutoSchedule = ganttProp.isAutoSchedule;
            taskbar.autoWidth = ganttProp.autoWidth;
            taskbar.autoLeft = ganttProp.autoLeft;
            taskbar.segment = ganttProp.segments;
            taskbar.isSpliterTask = (isNullOrUndefined(ganttProp.segments) || ganttProp.segments.length === 0) ? false : true;
            if(taskbar.isSpliterTask){
                taskbar.segmentCollection = taskbar.segment.map( (obj :any) => ({ ...obj }));}
            taskbar.baselineTop = this.parent.chartRowsModule.baselineTop;
            taskbar.isMilestone = ganttProp.isMilestone;
            taskbar.baselineStartDate = ganttProp.baselineStartDate;
            taskbar.baselineEndDate = ganttProp.baselineEndDate;
            taskbar.baselineLeft = ganttProp.baselineLeft;
            taskbar.baselineWidth = ganttProp.baselineWidth;
            taskbar.milestoneColor = new PdfColor(this.ganttStyle.taskbar.milestoneColor);
            taskbar.isParentTask = data.hasChildRecords;
            if (ganttProp.isMilestone) {
                taskbar.height = ganttProp.width;
            }
            if (data[this.parent.labelSettings.leftLabel]) {
                taskbar.leftTaskLabel.value = data[this.parent.labelSettings.leftLabel].toString();
            }
            if (data[this.parent.labelSettings.rightLabel]) {
                taskbar.rightTaskLabel.value = data[this.parent.labelSettings.rightLabel].toString();
            }
            if (data[this.parent.labelSettings.taskLabel]) {
                taskbar.taskLabel = data[this.parent.labelSettings.taskLabel].toString();
            }
            const reduceLeft: number = ganttProp.isMilestone ? Math.floor(this.parent.chartRowsModule.taskBarHeight / 2) + 33 : 33; // 33 indicates default timeline cell width
            taskbar.rightTaskLabel.left = ganttProp.left + ganttProp.width + reduceLeft; // right label left value
            taskbar.fontFamily = this.ganttStyle.fontFamily;
            taskbar.progressWidth = ganttProp.progressWidth;
            taskbar.labelColor = new PdfColor(this.ganttStyle.label.fontColor);
            taskbar.progressFontColor = new PdfColor(this.ganttStyle.taskbar.progressFontColor);
            if (taskbar.isParentTask) {
                taskbar.taskColor = new PdfColor(this.ganttStyle.taskbar.parentTaskColor);
                taskbar.taskBorderColor = new PdfColor(this.ganttStyle.taskbar.parentTaskBorderColor);
                taskbar.progressColor = new PdfColor(this.ganttStyle.taskbar.parentProgressColor);
            } else {
                if (data.isCritical) {
                    taskbar.taskColor = new PdfColor(this.ganttStyle.taskbar.criticalTaskColor);
                    taskbar.progressColor = new PdfColor(this.ganttStyle.taskbar.criticalProgressColor);
                    taskbar.taskBorderColor = new PdfColor(this.ganttStyle.taskbar.criticalTaskBorderColor);
                    taskbar.milestoneColor = new PdfColor(this.ganttStyle.taskbar.criticalTaskColor);
                }
                else {
                    taskbar.taskColor = new PdfColor(this.ganttStyle.taskbar.taskColor);
                    taskbar.progressColor = new PdfColor(this.ganttStyle.taskbar.progressColor);
                    taskbar.taskBorderColor = new PdfColor(this.ganttStyle.taskbar.taskBorderColor);
                }
            }
            taskbar.manualParentBorder = new PdfColor(this.ganttStyle.taskbar.manualParentBorder);
            taskbar.manualChildBorder = new PdfColor(this.ganttStyle.taskbar.manualChildBorder);
            taskbar.manuallineColor = new PdfColor(this.ganttStyle.taskbar.manualLineColor);
            taskbar.unscheduledTaskBarColor = new PdfColor(this.ganttStyle.taskbar.unscheduledTaskBarColor);
            taskbar.manualParentBackground = new PdfColor(this.ganttStyle.taskbar.manualParentBackground);
            taskbar.manualParentProgress = new PdfColor(this.ganttStyle.taskbar.manualParentProgress);
            taskbar.manualChildBackground = new PdfColor(this.ganttStyle.taskbar.manualChildBackground);
            taskbar.manualChildProgress = new PdfColor(this.ganttStyle.taskbar.manualChildProgress);
            taskbar.splitLineBackground = new PdfColor(this.ganttStyle.taskbar.splitLineBackground);
            taskbar.baselineColor = new PdfColor(this.ganttStyle.taskbar.baselineColor);
            taskbar.baselineBorderColor = new PdfColor(this.ganttStyle.taskbar.baselineBorderColor);
            taskbar.gridLineColor = new PdfColor(this.ganttStyle.chartGridLineColor);
            this.gantt.taskbarCollection.push(taskbar);
            const taskStyle: ITaskbarStyle = {};
            taskStyle.progressFontColor = taskbar.progressFontColor;
            taskStyle.taskColor = taskbar.taskColor;
            taskStyle.taskBorderColor = taskbar.taskBorderColor;
            taskStyle.progressColor = taskbar.progressColor;
            taskStyle.milestoneColor = taskbar.milestoneColor;
            taskStyle.baselineColor = taskbar.baselineColor;
            taskStyle.baselineBorderColor = taskbar.baselineBorderColor;
            const args: PdfQueryTaskbarInfoEventArgs = {
                taskbar: taskStyle,
                data: data,
                indicators:data.ganttProperties.indicators
            };
            if (this.parent.pdfQueryTaskbarInfo) {
                this.parent.trigger('pdfQueryTaskbarInfo', args);
                taskbar.progressFontColor = args.taskbar.progressFontColor;
                taskbar.taskColor = args.taskbar.taskColor;
                taskbar.taskBorderColor = args.taskbar.taskBorderColor;
                taskbar.progressColor = args.taskbar.progressColor;
                taskbar.milestoneColor = args.taskbar.milestoneColor;
                taskbar.baselineColor = args.taskbar.baselineColor;
                taskbar.baselineBorderColor = args.taskbar.baselineBorderColor;
                taskbar.indicators = args.indicators; 
            }
        });
    }
    /**
     * set text alignment of each columns in exporting grid
     *
     * @param {string} textAlign .
     * @param {PdfStringFormat} format .
     * @returns {PdfStringFormat} .
     * @private
     */
    private getHorizontalAlignment(textAlign: string, format?: PdfStringFormat): PdfStringFormat {
        if (format === undefined) {
            format = new PdfStringFormat();
        }
        switch (textAlign) {
            case 'Right':
                format.alignment = PdfTextAlignment.Right;
                break;
            case 'Center':
                format.alignment = PdfTextAlignment.Center;
                break;
            case 'Justify':
                format.alignment = PdfTextAlignment.Justify;
                break;
            case 'Left':
                format.alignment = PdfTextAlignment.Left;
                break;
        }
        return format;
    }
    /**
     * set vertical alignment of each columns in exporting grid
     *
     * @param {string} verticalAlign .
     * @param {PdfStringFormat} format .
     * @param {string} textAlign .
     * @returns {PdfStringFormat} .
     * @private
     */
    private getVerticalAlignment(verticalAlign: string, format?: PdfStringFormat, textAlign?: string): PdfStringFormat {
        if (format === undefined) {
            format = new PdfStringFormat();
            format = this.getHorizontalAlignment(textAlign, format);
        }
        switch (verticalAlign) {
            case 'Bottom':
                format.lineAlignment = PdfVerticalAlignment.Bottom;
                break;
            case 'Middle':
                format.lineAlignment = PdfVerticalAlignment.Middle;
                break;
            case 'Top':
                format.lineAlignment = PdfVerticalAlignment.Top;
                break;
        }
        return format;
    }

    private getFontFamily(fontFamily: string): number {
        switch (fontFamily) {
            case 'TimesRoman':
                return 2;
            case 'Courier':
                return 1;
            case 'Symbol':
                return 3;
            case 'ZapfDingbats':
                return 4;
            default:
                return 0;
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    private getFont(content: any): PdfFont {
        if (content.font) {
            return content.font;
        }
        const fontSize: number = (!isNullOrUndefined(content.style.fontSize)) ? (content.style.fontSize * 0.75) : 9.75;

        const fontFamily: number = (!isNullOrUndefined(content.style.fontFamily)) ?
            (this.getFontFamily(content.style.fontFamily)) : PdfFontFamily.TimesRoman;

        let fontStyle: PdfFontStyle = PdfFontStyle.Regular;
        if (!isNullOrUndefined(content.style.bold) && content.style.bold) {
            fontStyle |= PdfFontStyle.Bold;
        }

        if (!isNullOrUndefined(content.style.italic) && content.style.italic) {
            fontStyle |= PdfFontStyle.Italic;
        }

        if (!isNullOrUndefined(content.style.underline) && content.style.underline) {
            fontStyle |= PdfFontStyle.Underline;
        }

        if (!isNullOrUndefined(content.style.strikeout) && content.style.strikeout) {
            fontStyle |= PdfFontStyle.Strikeout;
        }

        return new PdfStandardFont(fontFamily, fontSize, fontStyle);
    }
    private renderEmptyGantt(): void {
        const row: PdfTreeGridRow = this.gantt.rows.addRow();
        row.cells.getCell(0).isHeaderCell = false;
        row.height = pixelToPoint(this.parent.rowHeight);
        this.copyStyles(this.ganttStyle.columnHeader, row.cells.getCell(0), row.isParentRow);
        const count: number = this.columns.length;
        row.cells.getCell(0).value = this.parent.localeObj.getConstant('emptyRecord');
        this.mergeCells(1, 0, count);
    }
    private mergeCells(rowIndex: number, colIndex: number, lastColIndex: number): void {
        this.gantt.rows.getRow(rowIndex).cells.getCell(colIndex).columnSpan = lastColIndex;
    }
    /* eslint-disable-next-line */
    private copyStyles(style: PdfGanttCellStyle, cell: PdfTreeGridCell, isParentRow: boolean): void {
        cell.style.fontColor = new PdfColor(style.fontColor);
        cell.style.backgroundColor = new PdfColor(style.backgroundColor);
        cell.style.borderColor = new PdfColor(style.borderColor);
        cell.style.fontSize = style.fontSize;
        cell.style.fontStyle = style.fontStyle;
        /* eslint-disable-next-line */
        cell.style.format = (<any>Object).assign(new PdfStringFormat(), style.format);
        cell.style.borders = new PdfBorders();
        cell.style.borders.all = new PdfPen(cell.style.borderColor);
        cell.style.padding = new PdfPaddings();
        let padding: number = 0;
        if (cell.isHeaderCell) {
            padding = this.parent.timelineModule.isSingleTier ? 45 / 2 : 60 / 2;
        } else {
            padding = this.parent.rowHeight / 2;
        }
        cell.style.padding.top = padding - style.fontSize;
        cell.style.padding.bottom = padding - style.fontSize;
        cell.style.padding.left = 10;
        cell.style.padding.right = 10;
        if (style.padding) {
            cell.style.padding = style.padding;
        }
        if (style.borders) {
            cell.style.borders = style.borders;
        }
    }

    /**
     * @param {PdfDocument} pdfDoc .
     * @returns {void} .
     * @private
     */
    public initializePdf(pdfDoc: PdfDocument): void {
        this.pdfDoc = pdfDoc;
        const widths: number[] = [];
        const treeColumnIndex: number = 0;
        const tWidth: number = (this.pdfDoc.pageSettings.width - 82);
        if (this.exportProps && this.exportProps.fitToWidthSettings && this.exportProps.fitToWidthSettings.isFitToWidth) {
            let gridWidth: number;
            if (this.exportProps.fitToWidthSettings.gridWidth) {
                gridWidth = parseInt(this.exportProps.fitToWidthSettings.gridWidth.split('%')[0]);
            }
            else {
                if (this.exportProps.fitToWidthSettings.chartWidth) {
                    let chartWidth: number = parseInt(this.exportProps.fitToWidthSettings.chartWidth.split('%')[0]);
                    gridWidth = 100 - chartWidth;
                }
                else {
                    gridWidth = 30;
                }
            }
            const pdfwidth: number = (this.parent.pdfExportModule['pdfPageDimensions'].width * gridWidth) / 100;
            const perColumnWidth: number = pdfwidth / this.gantt.columns.columns.length;
            for (let i: number = 0; i < this.gantt.columns.columns.length; i++) {
                this.gantt.columns.getColumn(i as number).width = perColumnWidth;
            }
        }
        if (this.totalColumnWidth > (this.pdfDoc.pageSettings.width - 82)) {
            this.gantt.style.allowHorizontalOverflow = true;
        } else if ((tWidth / this.columns.length) < widths[treeColumnIndex as number]) {
            this.gantt.columns.getColumn(treeColumnIndex as number).width = widths[treeColumnIndex as number];
        }
        if (this.exportProps.enableFooter || isNullOrUndefined(this.exportProps.enableFooter)) {
            //code for draw the footer content
            const bounds: RectangleF = new RectangleF(0, 0, pdfDoc.pageSettings.width, 35);
            const pen: PdfPen = new PdfPen(this.ganttStyle.chartGridLineColor);
            const footer: PdfPageTemplateElement = new PdfPageTemplateElement(bounds);
            const footerBrush: PdfBrush = new PdfSolidBrush(this.ganttStyle.footer.backgroundColor);
            footer.graphics.drawRectangle(pen, footerBrush, 0, 0, pdfDoc.pageSettings.width, 35);
            /* eslint-disable-next-line */
            let font: PdfTrueTypeFont | PdfStandardFont = new PdfStandardFont(this.ganttStyle.fontFamily, this.ganttStyle.footer.fontSize, this.ganttStyle.footer.fontStyle);
            if (this.ganttStyle.font) {
                font = this.ganttStyle.font;
            }
            const brush: PdfBrush = new PdfSolidBrush(this.ganttStyle.footer.fontColor);
            const pageNumber: PdfPageNumberField = new PdfPageNumberField(font);
            const count: PdfPageCountField = new PdfPageCountField(font, brush);
            const compositeField: PdfCompositeField = new PdfCompositeField(font, brush, 'Page {0}', pageNumber, count);
            compositeField.stringFormat = this.ganttStyle.footer.format;
            compositeField.bounds = bounds;
            compositeField.draw(footer.graphics, new PointF(0, 0));
            pdfDoc.template.bottom = footer;
        }
        const PdfPage  = this.parent.pdfExportModule.pdfPage;
        const pageSize = PdfPage.size;
        const clientSize: SizeF = !isNullOrUndefined(pageSize)?  pageSize : this.pdfDoc.pageSettings.size;
        // code for draw header content
        if (!isNullOrUndefined(this.exportProps.header)) {
            const headerProp: PdfHeader = this.exportProps.header;
            const position: PointF = new PointF(0, headerProp.fromTop);
            const size: SizeF = new SizeF((clientSize.width * 1.1), ((headerProp && headerProp.height) ? headerProp.height * 0.75 : 50));
            const bounds: RectangleF = new RectangleF(position, size);
            pdfDoc.template.top = this.drawPageTemplate(new PdfPageTemplateElement(bounds), headerProp);

        }
        // code for customization of footer
        if (!this.exportProps.enableFooter && !isNullOrUndefined(this.exportProps.footer)) {
            const footer: any = this.exportProps.footer;
            const position: PointF = new PointF(0, ((clientSize.width - 80) - ((footer && footer.fromBottom) ?
                footer.fromBottom * 0.75 : 0)));
            const size: SizeF = new SizeF((clientSize.width * 1.1), ((footer && footer.height) ? footer.height * 0.75 : 50));
            const bounds: RectangleF = new RectangleF(position, size);
            this.pdfDoc.template.bottom = this.drawPageTemplate(new PdfPageTemplateElement(bounds), footer);
        }
    }
    private drawPageTemplate(template: PdfPageTemplateElement, element: PdfHeader): PdfPageTemplateElement {
        for (const content of element.contents) {
            switch (content.type) {
                case 'Text':
                    if (content.value === '' || content.value === undefined || content.value === null || typeof content.value !== 'string') {
                        throw new Error('please enter the valid input value in text content...');
                    }
                    this.drawText(template, content);
                    break;
                case 'PageNumber':
                    this.drawPageNumber(template, content);
                    break;
                case 'Image':
                    if (content.src === undefined || content.src === null || content.src === '') {
                        throw new Error('please enter the valid base64 string in image content...');
                    }
                    this.drawImage(template, content);
                    break;
                case 'Line':
                    this.drawLine(template, content);
                    break;
                default:
                    throw new Error('Please set valid content type...');
            }
        }
        return template;
    }
    // code for draw text
    private drawText(pageTemplate: PdfPageTemplateElement, content: any): void {
        const font: PdfFont = this.getFont(content);
        let brush: PdfSolidBrush = this.getBrushFromContent(content);
        let pen: PdfPen = null;
        if (!isNullOrUndefined(content.style.textPenColor)) {
            const penColor: { r: number, g: number, b: number } = this.hexToRgb(content.style.textPenColor);
            pen = new PdfPen(new PdfColor(penColor.r, penColor.g, penColor.b));
        }
        if (brush == null && pen == null) {
            brush = new PdfSolidBrush(new PdfColor(0, 0, 0));
        }
        const value: string = content.value.toString();
        const x: number = content.position.x * 0.75;
        const y: number = content.position.y * 0.75;
        const format: PdfStringFormat = new PdfStringFormat();
        if (!isNullOrUndefined(content.style.stringFormat)) {
            format.alignment = content.style.stringFormat.alignment;
        }
        const result: { format: PdfStringFormat, size: SizeF } = this.setContentFormat(content, format);
        if (result !== null && !isNullOrUndefined(result.format) && !isNullOrUndefined(result.size)) {
            pageTemplate.graphics.drawString(value, font, pen, brush, x, y, result.size.width, result.size.height, result.format);
        } else {
            pageTemplate.graphics.drawString(value, font, pen, brush, x, y, format);
        }
    }
    // code for draw pagenumber
    private drawPageNumber(documentHeader: PdfPageTemplateElement, content: any): void {
        const font: PdfFont = this.getFont(content);
        let brush: PdfSolidBrush = null;
        if (!isNullOrUndefined(content.style.textBrushColor)) {
            const brushColor: { r: number, g: number, b: number } = this.hexToRgb(content.style.textBrushColor);
            brush = new PdfSolidBrush(new PdfColor(brushColor.r, brushColor.g, brushColor.b));
        } else {
            brush = new PdfSolidBrush(new PdfColor(0, 0, 0));
        }
        const pageCounts = this.pdfDoc.pages.count;
        const pageNumber: PdfPageNumberField = new PdfPageNumberField(font, brush);
        pageNumber.numberStyle = this.getPageNumberStyle(content.pageNumberType);
        let compositeField: PdfCompositeField;
        let format: string;
        if (!isNullOrUndefined(content.format)) {
            const total: string = '$total';
            const current: string = '$current';
            if ((content.format as string).indexOf(total) !== -1 && (content.format as string).indexOf(current) !== -1) {
                const pageCount: PdfPageCountField = new PdfPageCountField(font);
                pageCount.numberStyle = this.getPageNumberStyle(content.pageNumberType);
                if ((content.format as string).indexOf(total) > (content.format as string).indexOf(current)) {
                    format = (content.format as string).replace(current, '0');
                    format = format.replace(total, '1');
                } else {
                    format = (content.format as string).replace(current, '1');
                    format = format.replace(total, '0');
                }
                compositeField = new PdfCompositeField(font, brush, format, pageNumber, pageCount);
            } else if ((content.format as string).indexOf(current) !== -1 && (content.format as string).indexOf(total) === -1) {
                format = (content.format as string).replace(current, '0');
                compositeField = new PdfCompositeField(font, brush, format, pageNumber);
            } else {
                const pageCount: PdfPageCountField = new PdfPageCountField(font);
                format = (content.format as string).replace(total, '0');
                compositeField = new PdfCompositeField(font, brush, format, pageCount);
            }
        } else {
            format = '{0}';
            compositeField = new PdfCompositeField(font, brush, format, pageNumber);
        }
        const x: number = content.position.x * 0.75;
        const y: number = content.position.y * 0.75;
        const result: { format: PdfStringFormat, size: SizeF } = this.setContentFormat(content, compositeField.stringFormat);
        if (result !== null && !isNullOrUndefined(result.format) && !isNullOrUndefined(result.size)) {
            compositeField.stringFormat = result.format;
            compositeField.bounds = new RectangleF(x, y, result.size.width, result.size.height);
        }
        compositeField.draw(documentHeader.graphics, x, y);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // code for draw image
    private drawImage(documentHeader: PdfPageTemplateElement, content: any): void {
        const x: number = content.position.x * 0.75;
        const y: number = content.position.y * 0.75;
        const width: number = (!isNullOrUndefined(content.size) && !isNullOrUndefined(content.size.width)) ?
            (content.size.width * 0.50) : undefined;
        const height: number = (!isNullOrUndefined(content.size) && !isNullOrUndefined(content.size.height)) ?
            (content.size.height * 0.75) : undefined;

        const image: PdfBitmap = new PdfBitmap(content.src);
        if (!isNullOrUndefined(width)) {
            documentHeader.graphics.drawImage(image, x, y, width, height);
        } else {
            documentHeader.graphics.drawImage(image, x, y);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // code for draw line
    private drawLine(documentHeader: PdfPageTemplateElement, content: any): void {
        const x1: number = content.points.x1 * 0.75;
        const y1: number = content.points.y1 * 0.75;
        const x2: number = content.points.x2 * 0.75;
        const y2: number = content.points.y2 * 0.75;
        const pen: PdfPen = this.getPenFromContent(content);
        if (!isNullOrUndefined(content.style)) {
            if (!isNullOrUndefined(content.style.penSize) && typeof content.style.penSize === 'number') {
                pen.width = content.style.penSize * 0.75;
            }
            pen.dashStyle = this.getDashStyle(content.style.dashStyle);
        }
        documentHeader.graphics.drawLine(pen, x1, y1, x2, y2);
    }
    private getPenFromContent(content: PdfHeaderFooterContent): PdfPen {
        let pen: PdfPen = new PdfPen(new PdfColor(0, 0, 0));
        if (!isNullOrUndefined(content.style) && content.style !== null && !isNullOrUndefined(content.style.penColor)) {
            const penColor: { r: number, g: number, b: number } = this.hexToRgb(content.style.penColor);
            pen = new PdfPen(new PdfColor(penColor.r, penColor.g, penColor.b));
        }
        return pen;
    }
    private getDashStyle(dashStyle: PdfDashStyle): number {
        switch (dashStyle) {
            case 'Dash':
                return 1;
            case 'Dot':
                return 2;
            case 'DashDot':
                return 3;
            case 'DashDotDot':
                return 4;
            default:
                return 0;
        }
    }
    private getBrushFromContent(content: PdfHeaderFooterContent): PdfSolidBrush {
        let brush: PdfSolidBrush = null;
        if (!isNullOrUndefined(content.style.textBrushColor)) {
            /* tslint:disable-next-line:max-line-length */
            const brushColor: { r: number, g: number, b: number } = this.hexToRgb(content.style.textBrushColor);
            brush = new PdfSolidBrush(new PdfColor(brushColor.r, brushColor.g, brushColor.b));
        }
        return brush;
    }
    private hexToRgb(hex: string): { r: number, g: number, b: number } {
        if (hex === null || hex === '' || hex.length !== 7) {
            throw new Error('please set valid hex value for color...');
        }
        hex = hex.substring(1);
        const bigint: number = parseInt(hex, 16);
        const r: number = (bigint >> 16) & 255;
        const g: number = (bigint >> 8) & 255;
        const b: number = bigint & 255;
        return { r: r, g: g, b: b };
    }
    private setContentFormat(content: PdfHeaderFooterContent, format: PdfStringFormat): { format: PdfStringFormat, size: SizeF } {
        const width: number = (content.size) ? content.size.width * 0.75 : this.pdfDoc.pageSettings.size.width;
        const height: number = (content.size) ? content.size.height * 0.75 : this.exportProps.footer.height * 0.50;
        format = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Middle);
        if (!isNullOrUndefined(content.style.hAlign)) {
            switch (content.style.hAlign) {
                case 'Right':
                    format.alignment = PdfTextAlignment.Right;
                    break;
                case 'Center':
                    format.alignment = PdfTextAlignment.Center;
                    break;
                case 'Justify':
                    format.alignment = PdfTextAlignment.Justify;
                    break;
                default:
                    format.alignment = PdfTextAlignment.Left;
            }
        }
        if (!isNullOrUndefined(content.style.vAlign)) {
            format = this.getVerticalAlignment(content.style.vAlign, format);
        }
        return { format: format, size: new SizeF(width, height) };
    }
    private getPageNumberStyle(pageNumberType: PdfPageNumberType): number {
        switch (pageNumberType) {
            case 'LowerLatin':
                return 2;
            case 'LowerRoman':
                return 3;
            case 'UpperLatin':
                return 4;
            case 'UpperRoman':
                return 5;
            default:
                return 1;
        }
    }
}
/**
 * @hidden
 * `ExportValueFormatter` for `PdfExport` & `ExcelExport`
 */
export class ExportValueFormatter {
    private internationalization: Internationalization;
    private valueFormatter: ValueFormatter;
    public constructor(culture: string) {
        this.valueFormatter = new ValueFormatter(culture);
        this.internationalization = new Internationalization(culture);
    }
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    private returnFormattedValue(args: any, customFormat: DateFormatOptions): string {
        if (!isNullOrUndefined(args.value) && args.value) {
            return this.valueFormatter.getFormatFunction(customFormat)(args.value);
        } else {
            return '';
        }
    }
    /**
     * @private
     */
    /* eslint-disable-next-line  */
    public formatCellValue(args: any): string {
        if (args.isForeignKey) {
            args.value = getValue(args.column.foreignKeyValue, getForeignData(args.column, {}, args.value)[0]);
        }
        if (args.column.type === 'number' && args.column.format !== undefined && args.column.format !== '') {
            return args.value ? this.internationalization.getNumberFormat({ format: args.column.format })(args.value) : '';
        } else if (args.column.type === 'boolean') {
            return args.value ? 'true' : 'false';
        } else if ((args.column.type === 'date' || args.column.type === 'datetime' || args.column.type === 'time') && args.column.format !== undefined) {
            if (typeof args.value === 'string') {
                args.value = new Date(args.value);
            }
            if (typeof args.column.format === 'string') {
                let format: DateFormatOptions;
                if (args.column.type === 'date') {
                    format = { type: 'date', format: args.column.format };
                } else if (args.column.type === 'time') {
                    format = { type: 'time', format: args.column.format };
                } else {
                    format = { type: 'dateTime', format: args.column.format };
                }
                return this.returnFormattedValue(args, format);
            } else {
                if (args.column.format instanceof Object && args.column.format.type === undefined) {
                    return (args.value.toString());
                } else {
                    let customFormat: DateFormatOptions;
                    if (args.column.type === 'date') {
                        /* eslint-disable-next-line max-len */
                        customFormat = { type: args.column.format.type, format: args.column.format.format, skeleton: args.column.format.skeleton };
                    } else if (args.column.type === 'time') {
                        customFormat = { type: 'time', format: args.column.format.format, skeleton: args.column.format.skeleton };
                    } else {
                        customFormat = { type: 'dateTime', format: args.column.format.format, skeleton: args.column.format.skeleton };
                    }
                    return this.returnFormattedValue(args, customFormat);
                }
            }
        } else {
            if ((!isNullOrUndefined(args.column.type) && !isNullOrUndefined(args.value)) || !isNullOrUndefined(args.value)) {
                return (args.value).toString();
            } else {
                return '';
            }
        }
    }
}
