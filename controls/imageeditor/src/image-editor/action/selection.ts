import { Browser, EventHandler, extend, getComponent, isBlazor, isNullOrUndefined } from '@syncfusion/ej2-base';
import { ActivePoint, Dimension, NumericTextBox } from '@syncfusion/ej2-inputs';
import { BeforeSaveEventArgs, CropSelectionSettings, CurrentObject, ImageEditor, ImageEditorClickEventArgs, Point, SelectionChangeEventArgs, SelectionPoint, ShapeChangeEventArgs, ShapeSettings, ShapeType, StrokeSettings, TextSettings, ZoomTrigger } from '../index';
export class Selection {
    private parent: ImageEditor;
    private lowerContext: CanvasRenderingContext2D;
    private upperContext: CanvasRenderingContext2D;
    private diffPoint: Point = {x: 0, y: 0};  // updates resize points
    private oldPoint: Point = {} as Point;
    private isTouch: boolean = false;
    private isObjSelected: boolean = false;
    private isFhdPoint: boolean = false; // Specifies whether mouse cursor is on freehand drawing point or not
    private dragPoint: ActivePoint = {startX: 0, startY: 0, endX: 0, endY: 0};  // updates drag start and end points in mousedown and mousemove
    private isShapeInserted: boolean = false;
    private tempActiveObj: SelectionPoint = {activePoint: {startX: 0, startY: 0, endX: 0, endY: 0, width: 0, height: 0},
        flipObjColl: [], triangle: [], triangleRatio: []} as SelectionPoint; // for undo redo
    private isFirstMove: boolean = false; // for pinch zoom
    private startTouches: Point[] = []; // for pinch zoom
    private tempTouches: Point[] = []; // for pinch zoom
    private currMousePoint: Point = {x: 0, y: 0}; // To prevent mouse move event on pinch zoom
    private cursorTargetId: string = '';
    private isPreventDragging: boolean = false; // Shapes dragging is prevented when crop region is inside shape points
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    private timer: any; // mobile mode text area rendering on long touch
    private tempObjColl: SelectionPoint[]; // for undo redo
    private dragElement: string = '';
    private textRow: number = 1; // text area row count
    private mouseDownPoint: Point = {x: 0, y: 0};
    private previousPoint: Point = {x: 0, y: 0};  // updates prev x and y points in mouseMove
    private zoomType: string = 'Toolbar';
    private isInitialTextEdited: boolean = false;
    private dragCanvas: boolean = false;
    private isFhdCustomized: boolean = false;
    private touchEndPoint: Point = {} as Point;
    private panDown: Point; // To store pan down point
    private isFhdEditing: boolean = false; // Specifies whether freehand drawing is in editing mode or not
    private currentDrawingShape: string = '';
    private initialPrevObj: CurrentObject = {} as CurrentObject;
    private isCropSelection: boolean;
    private isPan: boolean;
    private pathAdjustedIndex: number;
    private touchTime: number = 0;
    private resizedElement: string = '';
    private shapeResizingArgs: ShapeChangeEventArgs;
    private shapeMovingArgs: ShapeChangeEventArgs;
    private selectionResizingArgs: SelectionChangeEventArgs;
    private isImageClarity: boolean = true;
    private isPinching: boolean = false;
    private isSliding: boolean = false;
    private mouseDown: string = '';

    constructor(parent: ImageEditor) {
        this.parent = parent;
        this.addEventListener();
    }

    public destroy(): void {
        if (this.parent.isDestroyed) { return; }
        this.removeEventListener();
    }

    private addEventListener(): void {
        this.parent.on('selection', this.selection, this);
        this.parent.on('destroyed', this.destroy, this);
    }

    private removeEventListener(): void {
        this.parent.off('selection', this.selection);
        this.parent.off('destroyed', this.destroy);
    }

    private selection(args?: { onPropertyChange: boolean, prop: string, value?: object }): void {
        const parent: ImageEditor = this.parent;
        this.updatePrivateVariables();
        switch (args.prop) {
        case 'mouse-up':
            this.selMouseUpEvent();
            break;
        case 'setCursor':
            this.setCursor(args.value['x'], args.value['y']);
            break;
        case 'updateActivePoint':
            this.updateActivePoint(args.value['x'], args.value['y'], args.value['isCropSelection']);
            break;
        case 'updateCursorStyles':
            this.updateCursorStyles(args.value['x'], args.value['y'], args.value['type']);
            break;
        case 'setTextSelection':
            this.setTextSelection(args.value['width'], args.value['height']);
            break;
        case 'setActivePoint':
            this.setActivePoint(args.value['startX'], args.value['startY']);
            break;
        case 'clearSelection':
            this.clearSelection();
            break;
        case 'calcShapeRatio':
            this.calcShapeRatio(args.value['x'], args.value['y'], args.value['imgWidth'], args.value['imgHeight']);
            break;
        case 'applyCurrShape':
            this.applyCurrShape(args.value['isShapeClick']);
            break;
        case 'tab':
            this.performTabAction();
            break;
        case 'setDragDirection':
            this.setDragDirection(args.value['width'], args.value['height']);
            break;
        case 'clearUpperCanvas':
            if (this.isTouch) {
                setTimeout(() => {
                    parent.upperCanvas.getContext('2d').clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
                }, 550);
            }
            break;
        case 'resetFreehandDrawVariables':
            this.isFhdEditing = this.isFhdPoint = false;
            break;
        case 'isShapeInserted':
            this.isShapeInserted = args.value['bool'];
            break;
        case 'redrawShape':
            this.redrawShape(args.value['obj']);
            break;
        case 'setTextBoxStylesToActObj':
            this.setTextBoxStylesToActObj();
            break;
        case 'mouseDownEventHandler':
            this.mouseDownEventHandler(args.value['e']);
            break;
        case 'mouseMoveEventHandler':
            this.mouseMoveEventHandler(args.value['e']);
            break;
        case 'mouseUpEventHandler':
            this.mouseUpEventHandler(args.value['e']);
            break;
        case 'canvasMouseDownHandler':
            this.canvasMouseDownHandler(args.value['e']);
            break;
        case 'canvasMouseMoveHandler':
            this.canvasMouseMoveHandler(args.value['e']);
            break;
        case 'canvasMouseUpHandler':
            this.canvasMouseUpHandler(args.value['e']);
            break;
        case 'touchStartHandler':
            this.touchStartHandler(args.value['e']);
            break;
        case 'keyDownEventHandler':
            this.keyDownEventHandler(args.value['e']);
            break;
        case 'handleScroll':
            this.handleScroll(args.value['e']);
            break;
        case 'textKeyDown':
            setTimeout(this.textKeyDown.bind(this), 1, args.value['e']);
            break;
        case 'deleteItem':
            this.deleteItem();
            break;
        case 'updatePrevShapeSettings':
            this.updatePrevShapeSettings(args.value['obj']);
            break;
        case 'getZoomType':
            args.value['obj']['zoomType'] = this.zoomType;
            break;
        case 'setZoomType':
            this.zoomType = args.value['zoomType'];
            break;
        case 'setInitialTextEdit':
            this.isInitialTextEdited = args.value['bool'];
            break;
        case 'setDragCanvas':
            this.dragCanvas = args.value['bool'];
            break;
        case 'setFreehandDrawCustomized':
            this.isFhdCustomized = args.value['isFreehandDrawCustomized'];
            break;
        case 'setTouchEndPoint':
            this.touchEndPoint.x = args.value['x'];
            this.touchEndPoint.y = args.value['y'];
            break;
        case 'getPanDown':
            args.value['obj']['panDown'] = this.panDown;
            break;
        case 'setPanDown':
            this.panDown = args.value['panDown'];
            break;
        case 'getFreehandDrawEditing':
            args.value['obj']['bool'] = this.isFhdEditing;
            break;
        case 'setFreehandDrawEditing':
            this.isFhdEditing = args.value['bool'];
            break;
        case 'getTempActObj':
            args.value['obj']['tempObj'] = this.tempActiveObj;
            break;
        case 'setTempActObj':
            this.tempActiveObj = args.value['obj'];
            break;
        case 'isInside':
            this.isInside(args.value['x'], args.value['y'], args.value['z1'], args.value['z2'], args.value['z3'], args.value['z4']);
            break;
        case 'setDragElement':
            this.dragElement = args.value['value'];
            break;
        case 'setObjSelected':
            this.isObjSelected = args.value['bool'];
            break;
        case 'adjustActObjForLineArrow':
            this.adjustActObjForLineArrow(args.value['obj']);
            break;
        case 'findTarget':
            this.findTarget(args.value['x'], args.value['y'], args.value['type']);
            break;
        case 'getCurrentFlipState':
            this.getCurrentFlipState();
            break;
        case 'setDragWidth':
            this.setDragWidth(args.value['width']);
            break;
        case 'setDragHeight':
            this.setDragHeight(args.value['setDragHeight']);
            break;
        case 'annotate':
            this.currentDrawingShape = args.value['shape'];
            if (args.value['shape'] === 'text') {
                parent.activeObj.textSettings.fontSize = 100;
                parent.activeObj.keyHistory = 'Enter Text';
                parent.notify('shape', { prop: 'initializeTextShape', onPropertyChange: false,
                    value: {text: null, fontFamily: null, fontSize: null, bold: null, italic: null, strokeColor: null }});
            } else if (args.value['shape'] === 'path') {
                parent.activeObj.pointColl = [];
            }
            break;
        case 'getCurrentDrawingShape':
            args.value['obj']['shape'] = this.currentDrawingShape;
            break;
        case 'setCurrentDrawingShape':
            this.currentDrawingShape = args.value['value'];
            break;
        case 'getTransRotationPoint':
            this.getTransRotationPoint(args.value['obj'], args.value['object']);
            break;
        case 'adjustNEPoints':
            this.adjustNEPoints(args.value['rectangle'], args.value['x'], args.value['y'], args.value['angle']);
            break;
        case 'adjustRotationPoints':
            this.adjustRotationPoints(args.value['rectangle'], args.value['x'], args.value['y'], args.value['angle'],
                                      args.value['type'], args.value['elem']);
            break;
        case 'getResizeDirection':
            this.getResizeDirection(args.value['rectangle'], args.value['x'], args.value['y'], args.value['angle']);
            break;
        case 'setResizedElement':
            this.resizedElement = args.value['value'];
            break;
        case 'reset':
            this.reset();
            break;
        case 'unWireEvent':
            this.unwireEvent();
            break;
        case 'updPtCollForShpRot':
            this.updPtCollForShpRot(args.value['obj']);
            break;
        case 'findImageRatio':
            this.findImageRatio(args.value['width'], args.value['height'], args.value['obj']);
            break;
        case 'getNumTextValue':
            this.getNumTextValue(args.value['obj']);
            break;
        case 'setImageClarity':
            this.isImageClarity = args.value['bool'];
            break;
        case 'upgradeImageQuality':
            this.upgradeImageQuality();
            break;
        case 'getScaleRatio':
            args.value['obj']['newScale'] = this.getScaleRatio(args.value['scale']);
            break;
        case 'triggerShapeChange':
            this.triggerShapeChange(args.value['shapeResizingArgs'], args.value['shapeMovingArgs'], args.value['type']);
            break;
        case 'limitDrag':
            args.value['bool'] = this.limitDrag(args.value['isStart']);
            break;
        case 'applyTransformToImg':
            this.applyTransformToImg(args.value['ctx']);
            break;
        case 'findTargetObj':
            args.value['obj']['bool'] = this.findTargetObj(args.value['x'], args.value['y'], args.value['isCrop']);
            break;
        case 'setSliding':
            this.isSliding = args.value['bool'];
            break;
        }
    }

    public getModuleName(): string {
        return 'selection';
    }

    private updatePrivateVariables(): void {
        const parent: ImageEditor = this.parent;
        if (parent.lowerCanvas) {this.lowerContext = parent.lowerCanvas.getContext('2d'); }
        if (parent.upperCanvas) {this.upperContext = parent.upperCanvas.getContext('2d'); }
    }

    private reset(): void {
        this.diffPoint = {x: 0, y: 0}; this.oldPoint = {} as Point;
        this.isTouch = this.isObjSelected = this.isFhdPoint = this.isShapeInserted = false;
        this.dragPoint = {startX: 0, startY: 0, endX: 0, endY: 0};
        this.tempActiveObj = {activePoint: {startX: 0, startY: 0, endX: 0, endY: 0, width: 0, height: 0},
            flipObjColl: [], triangle: [], triangleRatio: []} as SelectionPoint;
        this.isFirstMove = false; this.cursorTargetId = this.dragElement = '';
        this.startTouches = []; this.tempTouches = []; this.currMousePoint = {x: 0, y: 0};
        this.isPreventDragging = false; this.timer = undefined; this.tempObjColl = undefined;
        this.textRow = 1; this.mouseDownPoint = {x: 0, y: 0}; this.previousPoint = {x: 0, y: 0};
        this.zoomType = 'Toolbar'; this.isInitialTextEdited = false; this.dragCanvas = this.isPinching = false;
        this.isFhdCustomized = false; this.touchEndPoint = {} as Point; this.panDown = null; this.isSliding = false;
        this.isFhdEditing = false; this.pathAdjustedIndex = null; this.touchTime = 0; this.isImageClarity = true;
        this.currentDrawingShape = ''; this.initialPrevObj = {} as CurrentObject; this.resizedElement = '';
        this.mouseDown = '';
    }

    private performTabAction(): void {
        const parent: ImageEditor = this.parent;
        if (parent.textArea.style.display === 'block' || parent.textArea.style.display === 'inline-block') {
            const allowUndoRedoPush: boolean = this.applyCurrShape(false);
            parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                value: { x: null, y: null, isMouseDown: null } });
            if (allowUndoRedoPush) {
                parent.notify('undo-redo', {prop: 'updateCurrUrc', value: {type: 'ok' }});
            }
        }
    }

    private selMouseUpEvent(): void {
        this.oldPoint.x = undefined; this.oldPoint.y = undefined;
    }

    private getMouseCursor(actObj: SelectionPoint, x: number, y: number, isCropSelection: boolean, isApply: boolean): string {
        const rotationCirclePoint: Point = this.getTransRotationPoint(actObj);
        const radius: number = actObj.bottomCenterCircle.radius;
        let cursor: string = 'default'; const ratio: number = isApply ? 0 : ((actObj.topLeftCircle.radius * 2));
        if (x >= (actObj.topLeftCircle.startX - ratio) &&
            x <= (actObj.topLeftCircle.startX + ratio) &&
            y >= (actObj.topLeftCircle.startY - ratio) &&
            y <= (actObj.topLeftCircle.startY + ratio)) {
            cursor = 'nw-resize';
        }
        else if (x >= (actObj.topLeftCircle.startX - ratio) &&
            x <= (actObj.topRightCircle.startX - ratio) &&
            y >= (actObj.topCenterCircle.startY - ratio) &&
            y <= (actObj.topCenterCircle.startY + ratio)) {
            cursor = 'n-resize';
        }
        else if (x >= (actObj.topRightCircle.startX - ratio) &&
            x <= (actObj.topRightCircle.startX + ratio) &&
            y >= (actObj.topRightCircle.startY - ratio) &&
            y <= (actObj.topRightCircle.startY + ratio)) {
            cursor = 'ne-resize';
        }
        else if (x >= (actObj.centerLeftCircle.startX - ratio) &&
            x <= (actObj.centerLeftCircle.startX + ratio) &&
            y >= (actObj.topLeftCircle.startY - ratio) &&
            y <= (actObj.bottomLeftCircle.startY - ratio)) {
            cursor = 'w-resize';
        }
        else if (x >= (actObj.centerRightCircle.startX - ratio) &&
            x <= (actObj.centerRightCircle.startX + ratio) &&
            y >= (actObj.topRightCircle.startY - ratio) &&
            y <= (actObj.bottomRightCircle.startY - ratio)) {
            cursor = 'e-resize';
        }
        else if (x >= (actObj.bottomLeftCircle.startX - ratio) &&
            x <= (actObj.bottomLeftCircle.startX + ratio) &&
            y >= (actObj.bottomLeftCircle.startY - ratio) &&
            y <= (actObj.bottomLeftCircle.startY + ratio)) {
            cursor = 'sw-resize';
        }
        else if (x >= (actObj.bottomLeftCircle.startX - ratio) &&
            x <= (actObj.bottomRightCircle.startX - ratio) &&
            y >= (actObj.bottomCenterCircle.startY - ratio) &&
            y <= (actObj.bottomCenterCircle.startY + ratio)) {
            cursor = 's-resize';
        }
        else if (x >= (actObj.bottomRightCircle.startX - ratio) &&
            x <= (actObj.bottomRightCircle.startX + ratio) &&
            y >= (actObj.bottomRightCircle.startY - ratio) &&
            y <= (actObj.bottomRightCircle.startY + ratio)) {
            cursor = 'se-resize';
        }
        else if ((x >= actObj.activePoint.startX &&
            x <= actObj.activePoint.endX) && (y >= actObj.activePoint.startY &&
            y <= actObj.activePoint.endY)) {
            if (isCropSelection) {cursor = 'grab'; }
            else {cursor = 'move'; }
        }
        else if (rotationCirclePoint && !isApply &&
            x >= (rotationCirclePoint.x - (radius + 2)) &&
            x <= rotationCirclePoint.x + (radius + 2) &&
            y >= rotationCirclePoint.y - (radius + 2) &&
            y <= rotationCirclePoint.y + (radius + 2)) {
            cursor = 'grabbing';
        }
        else {
            cursor = 'default';
        }
        return cursor;
    }

    private setCursor(x: number, y: number): void {
        const parent: ImageEditor = this.parent;
        const frameObject: Object = {bool: null };
        parent.notify('toolbar', { prop: 'getFrameToolbar', onPropertyChange: false, value: {obj: frameObject }});
        if (parent.isResize || this.isSliding || frameObject['bool']) {parent.upperCanvas.style.cursor = 'default'; return; }
        let isCropSelection: boolean = false; let splitWords: string[];
        if (this.currentDrawingShape !== '') {
            parent.upperCanvas.style.cursor = parent.cursor = 'crosshair';
            return;
        }
        if (parent.currObjType.isDragging) {
            if (this.dragElement === '') {
                parent.upperCanvas.style.cursor = parent.cursor = 'move';
            } else {
                parent.upperCanvas.style.cursor = parent.cursor = this.dragElement;
            }
            return;
        }
        if (parent.activeObj.horTopLine !== undefined) {
            if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
            if (splitWords === undefined && parent.currObjType.isCustomCrop) {
                isCropSelection = true;
            } else if (splitWords !== undefined && splitWords[0] === 'crop'){
                isCropSelection = true;
            }
            if (!isCropSelection && parent.togglePan) {
                parent.lowerCanvas.style.cursor = parent.upperCanvas.style.cursor = parent.cursor = 'grab';
            }
            const cursor: string = parent.upperCanvas.style.cursor;
            const actObj: SelectionPoint = extend({}, parent.activeObj, {}, true) as SelectionPoint;
            this.cursorTargetId = actObj.currIndex;
            let degree: number;
            if (actObj.shapeDegree === 0) {degree = parent.transform.degree; }
            else {degree = parent.transform.degree - actObj.shapeDegree; }
            if (degree < 0) {degree = 360 + degree; }
            if (actObj.shape === 'line' || actObj.shape === 'arrow') {
                this.setCursorForLineArrow(actObj, x, y, parent.upperCanvas);
            } else if (actObj.shape === 'path') {
                this.setCursorForPath(actObj, x, y, parent.upperCanvas);
            } else if (!isNullOrUndefined(actObj.rotatedAngle) && actObj.rotatedAngle !== 0) {
                this.setCursorForRotatedObject(actObj, x, y, parent.upperCanvas);
            } else {
                parent.upperCanvas.style.cursor = parent.cursor = this.getMouseCursor(actObj, x, y, isCropSelection, false);
                const cursorColl: string[] = ['n-resize', 's-resize', 'e-resize', 'w-resize'];
                if ((actObj.shape === 'text') && cursorColl.indexOf(parent.cursor) > -1) {
                    parent.upperCanvas.style.cursor = parent.cursor = 'move';
                }
            }
            if (cursor === 'default' && parent.cursor === 'default' && isCropSelection) {
                parent.upperCanvas.style.cursor = parent.cursor = 'grab';
            }
            if (cursor === 'grab' && parent.cursor === 'default') {
                parent.upperCanvas.style.cursor = parent.cursor = 'grab';
            }
        }
        else if (parent.togglePan && !parent.togglePen) {
            parent.lowerCanvas.style.cursor = parent.upperCanvas.style.cursor = parent.cursor = 'grab';
        } else {
            if (parent.currObjType.isCustomCrop || parent.togglePen) {parent.upperCanvas.style.cursor = parent.cursor = 'crosshair'; }
            else {parent.upperCanvas.style.cursor = parent.cursor = 'default'; }
        }
        if (parent.cursor === 'default' || parent.cursor === 'grab') {
            const cursor: string = parent.upperCanvas.style.cursor;
            if (parent.objColl.length > 0 && (parent.cursor !== 'grab' || !isCropSelection)) {
                this.setCursorFromObj(x, y, parent.objColl, parent.upperCanvas, isCropSelection);
            }
            if (cursor === 'grab' && parent.cursor === 'default') {
                parent.upperCanvas.style.cursor = parent.cursor = 'grab';
            }
        }
        if ((parent.cursor === 'default' || parent.cursor === 'grab')
            && parent.pointColl[0] && (parent.cursor !== 'grab' || !isCropSelection)
            && !parent.currObjType.isDragging && !parent.currObjType.isResize) {
            this.setCursorForFreehandDrawing(x, y, parent.upperCanvas);
        }
    }

    private setCursorForPath(actObj: SelectionPoint, x: number, y: number, upperCanvas: HTMLCanvasElement): string {
        this.setCursorForLineArrow(actObj, x, y, upperCanvas);
        const parent: ImageEditor = this.parent;
        if (parent.cursor === 'default') {
            const obj: SelectionPoint = extend({}, actObj, null, true) as SelectionPoint; let isMove: boolean = false;
            for (let i: number = 1, len: number = actObj.pointColl.length; i < len; i++) {
                if (isMove) {
                    break;
                }
                obj.activePoint.startX = actObj.pointColl[i - 1].x; obj.activePoint.startY = actObj.pointColl[i - 1].y;
                obj.activePoint.endX = actObj.pointColl[i as number].x; obj.activePoint.endY = actObj.pointColl[i as number].y;
                parent.notify('shape', { prop: 'setPointCollForLineArrow', onPropertyChange: false,
                    value: {obj: obj }});
                const radius: number = actObj.topLeftCircle.radius;
                for (let j: number = 0, jLen: number = obj.pointColl.length; j < jLen; j++) {
                    const point: Point = obj.pointColl[j as number];
                    if (!isNullOrUndefined(point.x - (radius * 2)) &&
                        !isNullOrUndefined(point.x + (radius * 2)) &&
                        !isNullOrUndefined(point.y - (radius * 2)) &&
                        !isNullOrUndefined(point.y + (radius * 2)) &&
                        x >= (point.x - (radius * 2)) &&
                        x <= (point.x + (radius * 2)) &&
                        y >= (point.y - (radius * 2)) &&
                        y <= (point.y + (radius * 2))) {
                        upperCanvas.style.cursor = parent.cursor = 'move'; isMove = true;
                        break;
                    } else {
                        upperCanvas.style.cursor = parent.cursor = 'default';
                    }
                }
            }
        }
        return parent.cursor;
    }

    private setCursorForLineArrow(actObj: SelectionPoint, x: number, y: number, upperCanvas: HTMLCanvasElement): number {
        let index: number; const radius: number = actObj.topLeftCircle.radius;
        for (let i: number = 0, len: number = actObj.pointColl.length; i < len; i++) {
            const point: Point = actObj.pointColl[i as number];
            if (x >= (point.x - (radius * 2)) && x <= (point.x + (radius * 2)) &&
                y >= (point.y - (radius * 2)) && y <= (point.y + (radius * 2))) {
                upperCanvas.style.cursor = this.parent.cursor = 'move'; index = i;
                break;
            } else {
                upperCanvas.style.cursor = this.parent.cursor = 'default';
            }
        }
        return index;
    }

    private setCursorForRotatedObject(actObj: SelectionPoint, x: number, y: number, upperCanvas: HTMLCanvasElement): string {
        this.resizedElement = '';  const parent: ImageEditor = this.parent; const radius: number = actObj.bottomCenterCircle.radius;

        const horTP: Point = actObj.horTopLinePointColl[Math.round(actObj.horTopLinePointColl.length / 2)];
        const horTP1: Point = actObj.horTopLinePointColl[Math.round(actObj.horTopLinePointColl.length - 1)];
        const verLP: Point = actObj.verLeftLinePointColl[Math.round(actObj.verLeftLinePointColl.length / 2)];
        const verRP: Point = actObj.verRightLinePointColl[Math.round(actObj.verRightLinePointColl.length / 2)];
        const horBP: Point = actObj.horBottomLinePointColl[Math.round(actObj.horBottomLinePointColl.length / 2)];
        const horBP1: Point = actObj.horBottomLinePointColl[Math.round(actObj.horBottomLinePointColl.length - 1)];
        const rotCP: Point = actObj.rotationCirclePointColl;
        const horTP0: Point = actObj.horTopLinePointColl[0];
        const horBP0: Point = actObj.horBottomLinePointColl[0];
        if (x >= (horTP0.x - (radius + 2)) && x <= (horTP0.x + (radius + 2)) && y >= (horTP0.y - (radius + 2)) &&
            y <= (horTP0.y + (radius + 2))) {
            upperCanvas.style.cursor = parent.cursor = 'nw-resize';
        }
        else if (x >= (horTP.x - 5) && x <= (horTP.x + 5) && y >= (horTP.y - 5) && y <= (horTP.y + 5)) {
            upperCanvas.style.cursor = parent.cursor = this.resizedElement = 'n-resize';
        }
        else if (x >= (horTP1.x - (radius + 2)) && x <= (horTP1.x + (radius + 2)) && y >= (horTP1.y - (radius + 2)) &&
            y <= (horTP1.y + (radius + 2))) {
            upperCanvas.style.cursor = parent.cursor = 'ne-resize';
        }
        else if (x >= (verLP.x - 5) && x <= (verLP.x + 5) && y >= (verLP.y - 5) && y <= (verLP.y + 5)) {
            upperCanvas.style.cursor = parent.cursor = this.resizedElement = 'w-resize';
        }
        else if (x >= (verRP.x - 5) && x <= (verRP.x + 5) && y >= (verRP.y - 5) && y <= (verRP.y + 5)) {
            upperCanvas.style.cursor = parent.cursor = this.resizedElement = 'e-resize';
        }
        else if (x >= (horBP0.x - (radius + 2)) && x <= (horBP0.x + (radius + 2)) && y >= (horBP0.y - (radius + 2)) &&
            y <= (horBP0.y + (radius + 2))) {
            upperCanvas.style.cursor = parent.cursor = 'sw-resize';
        }
        else if (x >= (horBP.x - 5) && x <= (horBP.x + 5) && y >= (horBP.y - 5) && y <= (horBP.y + 5)) {
            upperCanvas.style.cursor = parent.cursor = this.resizedElement = 's-resize';
        }
        else if (x >= (horBP1.x - (radius + 2)) && x <= (horBP1.x + (radius + 2)) && y >= (horBP1.y - (radius + 2)) &&
            y <= (horBP1.y + (radius + 2))) {
            upperCanvas.style.cursor = parent.cursor = 'se-resize';
        }
        else if (rotCP && x >= (rotCP.x - (radius + 2)) && x <= rotCP.x + (radius + 2) && y >= rotCP.y - (radius + 2) &&
            y <= rotCP.y + (radius + 2)) {
            upperCanvas.style.cursor = parent.cursor = 'grabbing';
        }
        else {
            upperCanvas.style.cursor = parent.cursor = 'default';
            const isPointsInsideRectangle: boolean = this.getRectanglePoints(actObj.activePoint.startX,
                                                                             actObj.activePoint.startY,
                                                                             actObj.activePoint.width, actObj.activePoint.height,
                                                                             actObj.rotatedAngle * (180 / Math.PI ), x, y);
            if (isPointsInsideRectangle) {
                upperCanvas.style.cursor = parent.cursor = 'move';
            }
        }
        if (parent.cursor === 'default') {
            for (let i: number = 0, len: number = actObj.horTopLinePointColl.length; i < len; i++) {
                const horTP: Point = actObj.horTopLinePointColl[i as number];
                if (x >= (horTP.x - 5) && x <= (horTP.x + 5) && y >= (horTP.y - 5) && y <= (horTP.y + 5)) {
                    upperCanvas.style.cursor = parent.cursor = this.resizedElement = 'n-resize';
                    break;
                }
            }
        }
        if (parent.cursor === 'default') {
            for (let i: number = 0, len: number = actObj.horBottomLinePointColl.length; i < len; i++) {
                const horBP: Point = actObj.horBottomLinePointColl[i as number];
                if (x >= (horBP.x - 5) && x <= (horBP.x + 5) && y >= (horBP.y - 5) && y <= (horBP.y + 5)) {
                    upperCanvas.style.cursor = parent.cursor = this.resizedElement = 's-resize';
                    break;
                }
            }
        }
        if (parent.cursor === 'default') {
            for (let i: number = 0, len: number = actObj.verLeftLinePointColl.length; i < len; i++) {
                const verLP: Point = actObj.verLeftLinePointColl[i as number];
                if (x >= (verLP.x - 5) && x <= (verLP.x + 5) && y >= (verLP.y - 5) && y <= (verLP.y + 5)) {
                    upperCanvas.style.cursor = parent.cursor = this.resizedElement = 'w-resize';
                    break;
                }
            }
        }
        if (parent.cursor === 'default') {
            for (let i: number = 0, len: number = actObj.verRightLinePointColl.length; i < len; i++) {
                const verRP: Point = actObj.verRightLinePointColl[i as number];
                if (x >= (verRP.x - 5) && x <= (verRP.x + 5) && y >= (verRP.y - 5) && y <= (verRP.y + 5)) {
                    upperCanvas.style.cursor = parent.cursor = this.resizedElement = 'e-resize';
                    break;
                }
            }
        }
        this.adjustCursorStylesForRotatedState(actObj);
        return parent.cursor;
    }

    private adjustCursorStylesForRotatedState(actObj: SelectionPoint): string {
        const parent: ImageEditor = this.parent;
        let length: number = actObj.rotatedAngle * (180 / Math.PI);
        length = length > 0 ? Math.floor(length) : Math.ceil(length);
        if ((length >= 92 && length <= 182) || (length >= -178 && length <= -88)) {
            const cursorMap: object = {'nw-resize': 'ne-resize', 'n-resize': 's-resize',
                'ne-resize': 'nw-resize', 'w-resize': 'e-resize', 'e-resize': 'w-resize',
                'sw-resize': 'se-resize', 's-resize': 'n-resize', 'se-resize': 'sw-resize'
            };
            if (parent.cursor in cursorMap) { parent.cursor = cursorMap[parent.cursor]; }
        }
        parent.upperCanvas.style.cursor = this.getResizeElement((actObj.rotatedAngle * (180 / Math.PI)), parent.cursor);
        return parent.cursor;
    }

    private getResizeElement(degree: number, element: string): string {
        let resizeMappings: [number, number, string][] = [];
        switch (element) {
        case 'nw-resize':
            resizeMappings = [
                [337.5, 22.5, 'nw-resize'], [22.5, 67.5, 'n-resize'], [67.5, 112.5, 'ne-resize'],
                [112.5, 157.5, 'e-resize'], [157.5, 202.5, 'se-resize'],
                [202.5, 247.5, 's-resize'], [247.5, 292.5, 'sw-resize'],
                [292.5, 337.5, 'w-resize']
            ];
            break;
        case 'n-resize':
            resizeMappings = [
                [337.5, 22.5, 'n-resize'], [22.5, 67.5, 'ne-resize'], [67.5, 112.5, 'e-resize'],
                [112.5, 157.5, 'se-resize'], [157.5, 202.5, 's-resize'], [202.5, 247.5, 'sw-resize'],
                [247.5, 292.5, 'w-resize'], [292.5, 337.5, 'nw-resize']
            ];
            break;
        case 'ne-resize':
            resizeMappings = [
                [337.5, 22.5, 'ne-resize'],  [22.5, 67.5, 'e-resize'],
                [67.5, 112.5, 'se-resize'], [112.5, 157.5, 's-resize'], [157.5, 202.5, 'sw-resize'],
                [202.5, 247.5, 'w-resize'], [247.5, 292.5, 'nw-resize'], [292.5, 337.5, 'n-resize']
            ];
            break;
        case 'e-resize':
            resizeMappings = [
                [337.5, 22.5, 'e-resize'], [22.5, 67.5, 'se-resize'], [67.5, 112.5, 's-resize'],
                [112.5, 157.5, 'sw-resize'], [157.5, 202.5, 'w-resize'], [202.5, 247.5, 'nw-resize'],
                [247.5, 292.5, 'n-resize'], [292.5, 337.5, 'ne-resize']
            ];
            break;
        case 'se-resize':
            resizeMappings = [
                [337.5, 22.5, 'se-resize'], [22.5, 67.5, 's-resize'], [67.5, 112.5, 'sw-resize'],
                [112.5, 157.5, 'w-resize'], [157.5, 202.5, 'nw-resize'], [202.5, 247.5, 'n-resize'],
                [247.5, 292.5, 'ne-resize'], [292.5, 337.5, 'e-resize']
            ];
            break;
        case 's-resize':
            resizeMappings = [
                [337.5, 22.5, 's-resize'], [22.5, 67.5, 'sw-resize'], [67.5, 112.5, 'w-resize'],
                [112.5, 157.5, 'nw-resize'], [157.5, 202.5, 'n-resize'], [202.5, 247.5, 'ne-resize'],
                [247.5, 292.5, 'e-resize'], [292.5, 337.5, 'se-resize']
            ];
            break;
        case 'sw-resize':
            resizeMappings = [
                [337.5, 22.5, 'sw-resize'], [22.5, 67.5, 'w-resize'], [67.5, 112.5, 'nw-resize'],
                [112.5, 157.5, 'n-resize'], [157.5, 202.5, 'ne-resize'], [202.5, 247.5, 'e-resize'],
                [247.5, 292.5, 'se-resize'], [292.5, 337.5, 's-resize']
            ];
            break;
        case 'w-resize':
            resizeMappings = [
                [337.5, 22.5, 'w-resize'], [22.5, 67.5, 'nw-resize'], [67.5, 112.5, 'n-resize'],
                [112.5, 157.5, 'ne-resize'], [157.5, 202.5, 'e-resize'], [202.5, 247.5, 'se-resize'],
                [247.5, 292.5, 's-resize'], [292.5, 337.5, 'sw-resize']
            ];
            break;
        }
        const positiveDegree: number = degree < 0 ? 360 - Math.abs(degree) : degree;
        for (const [startDegree, endDegree, resizeElement] of resizeMappings) {
            if ((positiveDegree > startDegree && positiveDegree <= endDegree) ||
                (positiveDegree + 360 > startDegree && positiveDegree + 360 <= endDegree)) {
                return resizeElement;
            }
        }
        return element;
    }

    private setCursorForFreehandDrawing(x: number, y: number, upperCanvas: HTMLCanvasElement): void {
        const upperContext: CanvasRenderingContext2D = upperCanvas.getContext('2d');
        const parent: ImageEditor = this.parent;
        const textArea: HTMLInputElement = document.querySelector('#' + parent.element.id + '_textArea');
        let isEntered: boolean = false;
        parent.notify('freehand-draw', { prop: 'setFreehandDrawHoveredIndex', onPropertyChange: false,
            value: {index: -1 }});
        let sPoints: Point[];
        for (let n: number = 0; n < parent.freehandCounter; n++) {
            const obj: Object = {selPointColl: {} };
            parent.notify('freehand-draw', { prop: 'getSelPointColl', onPropertyChange: false, value: {obj: obj }});
            sPoints = extend([], obj['selPointColl'][n as number].points, []) as Point[];
            parent.points = extend([], parent.pointColl[n as number].points, []) as Point[];
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            const ptc: any = parent.pointColl[n as number];
            parent.notify('freehand-draw', { prop: 'setPointCounter', onPropertyChange: false, value: {value: 0 }});
            const len: number = sPoints.length;
            for (let l: number = 0; l < len; l++) {
                if (l !== 0) {
                    let isInside: boolean = false;
                    if (sPoints[l - 1] && sPoints[l as number]) {
                        isInside = this.isInside(x, y, sPoints[l - 1].x, sPoints[l - 1].y,
                                                 sPoints[l as number].x, sPoints[l as number].y);
                    }
                    if (isInside) {
                        this.isFhdPoint = true;
                        parent.notify('freehand-draw', { prop: 'setFreehandDrawHoveredIndex', onPropertyChange: false,
                            value: {index: n }});
                        parent.notify('freehand-draw', { prop: 'hoverFhd', onPropertyChange: false,
                            value: {strokeColor: null, strokeWidth: null }});
                        upperCanvas.style.cursor = parent.cursor = 'pointer';
                        isEntered = true;
                        break;
                    } else if (!this.isFhdEditing || ptc.isSelected) {
                        if (this.isFhdPoint || this.isFhdEditing) {
                            upperContext.clearRect(0, 0, upperCanvas.width, upperCanvas.height);
                            if (parent.activeObj.shape && textArea.style.display === 'none') {
                                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: parent.activeObj} });
                            }
                        }
                        if (this.isFhdEditing) {
                            const strokeColor: string = ptc.strokeColor;
                            parent.notify('freehand-draw', { prop: 'hoverFhd', onPropertyChange: false,
                                value: {strokeColor: strokeColor, strokeWidth: ptc.strokeWidth} });
                        } else {
                            parent.notify('freehand-draw', { prop: 'setFreehandDrawHoveredIndex', onPropertyChange: false,
                                value: {index: null }});
                        }
                        this.isFhdPoint = false;
                    }
                } else {
                    const pt: Point = parent.points[l as number];
                    if (x > pt.x - ptc.strokeWidth && x < pt.x + ptc.strokeWidth && y > pt.y - ptc.strokeWidth &&
                        y < pt.y + ptc.strokeWidth) {
                        this.isFhdPoint = true;
                        parent.notify('freehand-draw', { prop: 'setFreehandDrawHoveredIndex', onPropertyChange: false, value: {index: n }});
                        parent.notify('freehand-draw', { prop: 'hoverFhd', onPropertyChange: false, value: {strokeColor: null, strokeWidth: null }});
                        upperCanvas.style.cursor = parent.cursor = 'pointer';
                        isEntered = true;
                        break;
                    } else if (!this.isFhdEditing || ptc.isSelected) {
                        if (this.isFhdPoint || this.isFhdEditing) {
                            upperContext.clearRect(0, 0, upperCanvas.width, upperCanvas.height);
                            if (parent.activeObj.shape && textArea.style.display === 'none') {
                                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: parent.activeObj} });
                            }
                        }
                        if (this.isFhdEditing) {
                            const strokeColor: string = ptc.strokeColor;
                            parent.notify('freehand-draw', { prop: 'hoverFhd', onPropertyChange: false,
                                value: {strokeColor: strokeColor, strokeWidth: ptc.strokeWidth} });
                        }
                        this.isFhdPoint = false;
                    }
                }
            }
            if (isEntered) {
                break;
            }
        }
    }

    private setCursorFromObj(x: number, y: number, obj: SelectionPoint[], upperCanvas: HTMLCanvasElement, isCropSelection: boolean): void {
        const parent: ImageEditor = this.parent;
        for (let i: number = 0, len: number = obj.length; i < len; i++) {
            if (parent.cursor === 'move') {return; }
            const actObj: SelectionPoint = extend({}, obj[i as number], {}, true) as SelectionPoint;
            this.cursorTargetId = actObj.currIndex;
            if (actObj.shape === 'line' || actObj.shape === 'arrow') {
                this.setCursorForLineArrow(actObj, x, y, upperCanvas);
            } else if (actObj.shape === 'path') {
                this.setCursorForPath(actObj, x, y, upperCanvas);
            } else if (!isNullOrUndefined(actObj.rotatedAngle) && actObj.rotatedAngle !== 0) {
                this.setCursorForRotatedObject(actObj, x, y, upperCanvas);
            } else {
                upperCanvas.style.cursor = parent.cursor = this.getMouseCursor(actObj, x, y, isCropSelection, true);
            }
        }
    }

    private isInside(x: number, y: number, z1: number, z2: number, z3: number, z4: number): boolean {
        const x1: number = Math.min(z1, z3);
        const x2: number = Math.max(z1, z3);
        const y1: number = Math.min(z2, z4);
        const y2: number = Math.max(z2, z4);
        if ((x1 <= x && x <= x2) && (y1 <= y && y <= y2)) {return true; }
        else {return false; }
    }

    private updateActivePoint(x: number, y: number, isCropSelection: boolean):  void {
        const parent: ImageEditor = this.parent;
        const obj: Object = {width: 0, height: 0 };
        let { startX, startY, endX, endY } = parent.activeObj.activePoint;
        const { width, height } = parent.activeObj.activePoint;
        parent.notify('transform', { prop: 'calcMaxDimension', onPropertyChange: false,
            value: {width: width, height: height, obj: obj, isImgShape: null}});
        const maxDimension: Dimension = obj as Dimension;
        const previousShapeSettings: ShapeSettings = this.updatePrevShapeSettings();
        const shapeResizingArgs: ShapeChangeEventArgs = {cancel: false, action: 'resize',  previousShapeSettings: previousShapeSettings};
        const shapeMovingArgs: ShapeChangeEventArgs = {cancel: false, action: 'move', previousShapeSettings: previousShapeSettings};
        this.shapeResizingArgs = shapeResizingArgs;
        this.shapeMovingArgs = shapeMovingArgs;
        if (parent.activeObj.shape === 'text' && this.dragElement !== '') {
            parent.notify('shape', { prop: 'updateFontRatio', onPropertyChange: false,
                value: {obj: parent.activeObj, isTextArea: null}});
        }
        if (this.currentDrawingShape !== '' && (this.dragElement === '' || this.dragElement === 'move')) {
            const shapeColl: string[] = ['line', 'arrow', 'path'];
            if (shapeColl.indexOf(parent.activeObj.shape) > -1) {this.dragElement = 'e-resize'; }
            else {
                if (x > startX && y > startY) {
                    this.dragElement = 'se-resize';
                } else if (x < startX && y > startY) {
                    this.dragElement = 'sw-resize';
                } else if (x > startX && y < startY) {
                    this.dragElement = 'ne-resize';
                } else if (x < startX && y < startY) {
                    this.dragElement = 'nw-resize';
                }
            }
        }
        if (parent.activeObj.shape === 'arrow') {
            if (Math.atan2(x - parent.lowerCanvas.width / 2, y - parent.lowerCanvas.height / 2) > 0) {
                parent.activeObj.rotatedAngle = -Math.atan2(x - parent.lowerCanvas.width / 2, y - parent.lowerCanvas.height / 2);
            } else {
                parent.activeObj.rotatedAngle = Math.abs(Math.atan2(x - parent.lowerCanvas.width / 2, y - parent.lowerCanvas.height / 2));
            }
        }
        let degree: number; let isHorizontalflip: boolean = false; let isVerticalflip: boolean = false;
        if (isCropSelection && parent.transform.straighten !== 0 && this.isMouseOutsideImg(x, y)) {
            return;
        }
        switch (this.dragElement.toLowerCase()) {
        case 'nw-resize':
            this.updateNWPoints(x, y, maxDimension);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 'n-resize':
            this.updateNPoints(x, y);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 'ne-resize':
            this.updateNEPoints(x, y, maxDimension);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 'w-resize':
            this.updateWPoints(x, y);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 'e-resize':
            this.updateEPoints(x, y);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 'sw-resize':
            this.updateSWPoints(x, y, maxDimension);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 's-resize':
            this.updateSPoints(x, y);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 'se-resize':
            this.updateSEPoints(x, y, maxDimension);
            parent.notify('shape', { prop: 'updateArrowDirection', onPropertyChange: false,
                value: {obj: parent.activeObj, flip: null, rotatedDegree: null}});
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'resize');
            break;
        case 'grabbing':
            if (Math.atan2(x - (startX + (width / 2)), y - (startY + (height / 2))) > 0) {
                parent.activeObj.rotatedAngle = -Math.atan2(x - (startX + (width / 2)), y - (startY + (height / 2)));
            } else {
                parent.activeObj.rotatedAngle = Math.abs(Math.atan2(x - (startX + (width / 2)), y - (startY + (height / 2))));
            }
            if (parent.activeObj.shapeDegree === 0) {degree = parent.transform.degree; }
            else {degree = parent.transform.degree - parent.activeObj.shapeDegree; }
            if (degree < 0) {degree = 360 + degree; }
            for (let i: number = 0, len: number = parent.activeObj.flipObjColl.length; i < len; i++) {
                if (parent.activeObj.flipObjColl[i as number].toLowerCase() === 'horizontal') {
                    isHorizontalflip = true;
                } else if (parent.activeObj.flipObjColl[i as number].toLowerCase() === 'vertical') {
                    isVerticalflip = true;
                }
            }
            parent.activeObj.rotatedAngle -= (degree * (Math.PI / 180));
            if (degree === 0 || degree === 360) {
                if (isVerticalflip) {parent.activeObj.rotatedAngle -= (180 * (Math.PI / 180)); }
            } else if (degree === 90 || degree === -270) {
                if (isHorizontalflip) {parent.activeObj.rotatedAngle -= (180 * (Math.PI / 180)); }
            } else if (degree === 180 || degree === -180) {
                if (isVerticalflip) {parent.activeObj.rotatedAngle -= (180 * (Math.PI / 180)); }
            } else if (degree === 270 || degree === -90) {
                if (isHorizontalflip) {parent.activeObj.rotatedAngle -= (180 * (Math.PI / 180)); }
            }
            break;
        case 'pathdrag':
            if (!isNullOrUndefined(this.pathAdjustedIndex)) {
                parent.activeObj.pointColl[this.pathAdjustedIndex].x = x;
                parent.activeObj.pointColl[this.pathAdjustedIndex].y = y;
            }
            break;
        default:
            if (!isCropSelection && !parent.currObjType.isCustomCrop) {
                const activePoint: ActivePoint = parent.activeObj.activePoint;
                if (this.dragPoint.startX) {
                    const width: number = (this.dragPoint.endX - this.previousPoint.x);
                    const height: number = (this.dragPoint.endY - this.previousPoint.y);
                    activePoint.startX += width;
                    activePoint.endX += width;
                    activePoint.startY += height;
                    activePoint.endY += height;
                    startX = activePoint.startX; startY = activePoint.startY;
                    endX = activePoint.endX; endY = activePoint.endY;
                    if (parent.activeObj.shape !== 'line' && parent.activeObj.shape !== 'arrow' &&
                        parent.activeObj.rotationCirclePointColl) {
                        parent.activeObj.rotationCirclePointColl.x += width;
                        parent.activeObj.rotationCirclePointColl.y += height;
                        parent.activeObj.rotationCirclePoint.x += width;
                        parent.activeObj.rotationCirclePoint.y += height;
                    }
                    if (parent.activeObj.shape === 'path') {
                        for (let i: number = 0, len: number = parent.activeObj.pointColl.length; i < len; i++) {
                            parent.activeObj.pointColl[i as number].x += width;
                            parent.activeObj.pointColl[i as number].y += height;
                        }
                    }
                    if (!this.isPreventDragging && parent.activeObj.shape !== 'line' && (parent.activeObj.rotatedAngle === 0 && (startX < parent.img.destLeft ||
                        startY < parent.img.destTop || endX >
                        parent.img.destLeft + parent.img.destWidth || endY > parent.img.destTop
                        + parent.img.destHeight))) {
                        activePoint.startX -= width;
                        activePoint.endX -= width;
                        activePoint.startY -= height;
                        activePoint.endY -= height;
                        if (parent.activeObj.shape !== 'line' && parent.activeObj.shape !== 'arrow' &&
                            parent.activeObj.rotationCirclePointColl) {
                            parent.activeObj.rotationCirclePointColl.x -= width;
                            parent.activeObj.rotationCirclePointColl.y -= height;
                            parent.activeObj.rotationCirclePoint.x -= width;
                            parent.activeObj.rotationCirclePoint.y -= height;
                        }
                        this.setDragWidth(width); this.setDragHeight(height);
                    }
                } else {
                    activePoint.startX = x < this.mouseDownPoint.x ? x : this.mouseDownPoint.x;
                    activePoint.startY = y < this.mouseDownPoint.y ? y : this.mouseDownPoint.y;
                    x = x < this.mouseDownPoint.x ? this.mouseDownPoint.x : x;
                    y = y < this.mouseDownPoint.y ? this.mouseDownPoint.y : y;
                    activePoint.endX = x;
                    activePoint.endY = y;
                }
                this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'move');
            }
            break;
        }
    }

    private triggerShapeChange(shapeResizingArgs: ShapeChangeEventArgs, shapeMovingArgs: ShapeChangeEventArgs, type: string): void {
        const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        actPoint.width = actPoint.endX - actPoint.startX;
        actPoint.height = actPoint.endY - actPoint.startY;
        const currentShapeSettings: ShapeSettings = this.updatePrevShapeSettings();
        if (!isNullOrUndefined(this.shapeResizingArgs) && !isNullOrUndefined(this.shapeMovingArgs)) {
            shapeResizingArgs.currentShapeSettings = this.shapeResizingArgs.currentShapeSettings = currentShapeSettings;
            shapeMovingArgs.currentShapeSettings =  this.shapeMovingArgs.currentShapeSettings = currentShapeSettings;
        } else {
            shapeResizingArgs.currentShapeSettings = currentShapeSettings;
            shapeMovingArgs.currentShapeSettings = currentShapeSettings;
        }
        if (type === 'resize') {
            this.isCropSelection = false; let splitWords: string[];
            if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
            if (splitWords !== undefined && splitWords[0] === 'crop') {
                this.isCropSelection = true;
            }
            if (!this.isCropSelection && parent.eventType !== 'resize' && isBlazor() && parent.events && parent.events.onShapeResizeStart.hasDelegate === true) {
                shapeResizingArgs.action = this.currentDrawingShape !== '' ? 'drawing' : 'resize-start';
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                (parent.dotNetRef.invokeMethodAsync('ShapeEventAsync', 'OnShapeResizeStart', shapeResizingArgs, null) as any).then((shapeResizingArgs: ShapeChangeEventArgs) => {
                    parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                        value: {shapeSettings: shapeResizingArgs.currentShapeSettings}});
                });
            } else if (!this.isCropSelection) {
                if (this.currentDrawingShape !== '') {shapeResizingArgs.action = 'drawing'; }
                parent.trigger('shapeChanging', shapeResizingArgs);
                parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                    value: {shapeSettings: shapeResizingArgs.currentShapeSettings}});
            } else {
                const selectionResizingArgs: SelectionChangeEventArgs = {action: shapeResizingArgs.action,
                    previousSelectionSettings: {type: parent.getSelectionType(parent.activeObj.shape),
                        startX: shapeResizingArgs.previousShapeSettings.startX,
                        startY: shapeResizingArgs.previousShapeSettings.startY,
                        width: shapeResizingArgs.previousShapeSettings.width,
                        height: shapeResizingArgs.previousShapeSettings.height},
                    currentSelectionSettings: {type: parent.getSelectionType(parent.activeObj.shape),
                        startX: shapeResizingArgs.currentShapeSettings.startX,
                        startY: shapeResizingArgs.currentShapeSettings.startY,
                        width: shapeResizingArgs.currentShapeSettings.width,
                        height: shapeResizingArgs.currentShapeSettings.height}};
                this.selectionResizingArgs = selectionResizingArgs;
                if (isBlazor() && isNullOrUndefined(parent.eventType) && parent.events &&
                    parent.events.onSelectionResizeStart.hasDelegate === true) {
                    selectionResizingArgs.action = 'resize-start';
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    (parent.dotNetRef.invokeMethodAsync('SelectionEventAsync', 'OnSelectionResizeStart', selectionResizingArgs) as any).then((selectionResizingArgs: SelectionChangeEventArgs) => {
                        parent.notify('shape', { prop: 'updSelChangeEventArgs', onPropertyChange: false,
                            value: {selectionSettings: selectionResizingArgs.currentSelectionSettings}});
                    });
                } else {
                    parent.trigger('selectionChanging', selectionResizingArgs);
                    parent.notify('shape', { prop: 'updSelChangeEventArgs', onPropertyChange: false,
                        value: {selectionSettings: selectionResizingArgs.currentSelectionSettings}});
                }
            }
        } else if (type === 'mouse-down' || type === 'mouse-up') {
            if (isBlazor() && parent.events && parent.events.shapeChanging.hasDelegate === true) {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                (parent.dotNetRef.invokeMethodAsync('ShapeEventAsync', 'OnShape',  shapeResizingArgs, null) as any).then((shapeResizingArgs: ShapeChangeEventArgs) => {
                    parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                        value: {shapeSettings: shapeResizingArgs.currentShapeSettings}});
                });
            } else {
                parent.trigger('shapeChanging', shapeResizingArgs);
                parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                    value: {shapeSettings: shapeResizingArgs.currentShapeSettings}});
            }
        } else {
            if (isBlazor() && isNullOrUndefined(parent.eventType) && parent.events &&
                parent.events.onShapeDragStart.hasDelegate === true) {
                shapeMovingArgs.action = 'drag-start';
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                (parent.dotNetRef.invokeMethodAsync('ShapeEventAsync', 'OnShapeDragStart', shapeMovingArgs, null) as any).then((shapeMovingArgs: ShapeChangeEventArgs) => {
                    parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                        value: {shapeSettings: shapeMovingArgs.currentShapeSettings}});
                });
            } else {
                parent.trigger('shapeChanging', shapeMovingArgs);
                parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                    value: {shapeSettings: shapeMovingArgs.currentShapeSettings}});
            }
        }
        parent.eventType = type;
    }

    private setDragWidth(width: number): void {
        const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        const { destLeft, destWidth } = parent.img;
        const tempWidth: number = width;
        if (tempWidth >= 0) {
            for (let i: number = 0; i < tempWidth; i++) {
                width = tempWidth - i;
                actPoint.startX += width; actPoint.endX += width;
                if (actPoint.startX >= destLeft &&
                    actPoint.endX <= destLeft + destWidth) {
                    break;
                } else {
                    actPoint.startX -= width; actPoint.endX -= width;
                }
            }
        } else {
            for (let i: number = 1; i < Math.abs(tempWidth); i++) {
                width = tempWidth + i;
                actPoint.startX += width; actPoint.endX += width;
                if (actPoint.startX >= destLeft &&
                    actPoint.endX <= destLeft + destWidth) {
                    break;
                } else {
                    actPoint.startX -= width; actPoint.endX -= width;
                }
            }
        }
    }

    private setDragHeight(height: number): void {
        const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        const { destTop, destHeight } = parent.img;
        const tempHeight: number = height;
        if (tempHeight >= 0) {
            for (let i: number = 1; i < tempHeight; i++) {
                height = tempHeight - i;
                actPoint.startY += height; actPoint.endY += height;
                if (actPoint.startY >= destTop &&
                    actPoint.endY <= destTop + destHeight) {
                    break;
                } else {
                    actPoint.startY -= height; actPoint.endY -= height;
                }
            }
        } else {
            for (let i: number = 0; i < Math.abs(tempHeight); i++) {
                height = tempHeight + i;
                actPoint.startY += height; actPoint.endY += height;
                if (actPoint.startY >= destTop &&
                    actPoint.endY <= destTop + destHeight) {
                    break;
                } else {
                    actPoint.startY -= height; actPoint.endY -= height;
                }
            }
        }
    }

    private limitDrag(isStart: boolean): boolean {
        let isLimiting: boolean = false;
        const parent: ImageEditor = this.parent;
        const { destLeft, destTop, destWidth, destHeight } = parent.img;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        let startX: number = isStart ? actPoint.startX : actPoint.endX;
        let startY: number = isStart ? actPoint.startY : actPoint.endY;
        let endX: number = isStart ? actPoint.endX : actPoint.startX;
        let endY: number = isStart ? actPoint.endY : actPoint.startY;
        if (startX < destLeft) {startX = destLeft; }
        if (startY < destTop) {startY = destTop; }
        if (endX > destLeft + destWidth) {endX = destLeft + destWidth; }
        if (endY > destTop + destHeight) {endY = destTop + destHeight; }
        if (parent.transform.straighten !== 0) {
            const obj: Object = {isIntersect: null, arr: null };
            parent.notify('draw', { prop: 'updateImgCanvasPoints', onPropertyChange: false });
            parent.notify('draw', { prop: 'isLinesIntersect', onPropertyChange: false, value: {obj: obj }});
            if (obj['arr'][0] || obj['arr'][1] || obj['arr'][2] || obj['arr'][3]) {
                isLimiting = true;
            }
        }
        if (isStart) {
            actPoint.startX = startX; actPoint.startY = startY;
            actPoint.endX = endX; actPoint.endY = endY;
        } else {
            actPoint.startX = endX; actPoint.startY = endY;
            actPoint.endX = startX; actPoint.endY = startY;
        }
        return isLimiting;
    }

    private isMouseOutsideImg(x: number, y: number): boolean {
        const obj: Object = {bool: false };
        this.parent.notify('draw', { prop: 'updateImgCanvasPoints', onPropertyChange: false });
        this.parent.notify('draw', { prop: 'isPointsInsideImg', value: {obj: obj, x: x, y: y }});
        return obj['bool'];
    }

    private preventDraggingInvertly(): boolean {
        let isLimiting: boolean = false;
        const parent: ImageEditor = this.parent;
        if (parent.activeObj.shape === 'image') {return isLimiting; }
        if (!this.isPreventDragging && parent.activeObj.rotatedAngle === 0) {
            isLimiting = this.limitDrag(true);
            const shapeColl: string[] = ['line', 'arrow', 'path'];
            if (shapeColl.indexOf(parent.activeObj.shape) > -1) {
                isLimiting = this.limitDrag(false);
            }
        }
        return isLimiting;
    }

    private preventTextDraggingInvertly(): boolean {
        const parent: ImageEditor = this.parent; let isLimiting: boolean = false;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        const { destLeft, destTop, destWidth, destHeight } = parent.img;
        if (!this.isPreventDragging) {
            if (actPoint.startX < destLeft ||
                actPoint.startY < destTop ||
                actPoint.endX > destLeft + destWidth ||
                actPoint.endY > destTop + destHeight) {
                isLimiting = true;
            }
        }
        return isLimiting;
    }

    private preventInverseResize(tempActiveObj: SelectionPoint): void {
        const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        if (actPoint.width < 0) {
            actPoint.width = 0;
            actPoint.startX = tempActiveObj.activePoint.startX;
            actPoint.endX = tempActiveObj.activePoint.endX;
        }
        if (actPoint.height < 0) {
            actPoint.height = 0;
            actPoint.startY = tempActiveObj.activePoint.startY;
            actPoint.endY = tempActiveObj.activePoint.endY;
        }
    }

    private getScaleRatio(scale: number): Point {
        const parent: ImageEditor = this.parent; const point: Point = {x: scale, y: scale};
        if (parent.activeObj.shape && parent.activeObj.shape !== 'crop-custom' &&
            parent.activeObj.shape !== 'crop-circle' && parent.activeObj.shape !== 'crop-square') {
            let ratio: string[] = parent.activeObj.shape === 'image' || parent.activeObj.shape === 'text' ?
                this.findImageRatio(parent.activeObj.activePoint.width, parent.activeObj.activePoint.height).split('-') :
                parent.activeObj.shape.split('-');
            if (ratio.length > 1 || parent.activeObj.shape === 'image' || parent.activeObj.shape === 'text') {
                ratio = parent.activeObj.shape === 'image' || parent.activeObj.shape === 'text' ? ratio[0].split(':') : ratio[1].split(':');
                const newScale: number = scale / (parseInt(ratio[1], 10));
                point.x = newScale * (parseInt(ratio[0], 10)); point.y = newScale * (parseInt(ratio[1], 10));
            }
        }
        return point;
    }

    private findImageRatio(width: number, height: number, obj?: Object): string {
        // eslint-disable-next-line @typescript-eslint/tslint/config
        const gcd = (a: number, b: number): number => {
            if (b === 0) {
                return a;
            }
            return gcd(b, a % b);
        };
        const divisor: number = gcd(width, height);
        const ratio: string = `${width / divisor}:${height / divisor}`;
        if (obj) {obj['ratio'] = ratio; }
        return ratio;
    }

    private revertResizing(tempActiveObj: SelectionPoint): void {
        const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        if (this.preventDraggingInvertly()) {
            actPoint.startX = tempActiveObj.activePoint.startX;
            actPoint.startY = tempActiveObj.activePoint.startY;
            actPoint.endX = tempActiveObj.activePoint.endX;
            actPoint.endY = tempActiveObj.activePoint.endY;
        }
    }

    private updateNWPoints(x: number, y: number, maxDimension: Dimension): void {
        const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape === 'text') {
            this.resizeImg(x, y, 'nw-resize', tempActiveObj);
            parent.notify('shape', { prop: 'updateFontSize', onPropertyChange: false,
                value: {obj: parent.activeObj}});


        } else {
            let splitWords: string[];
            if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape !== undefined && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape === 'image') {
                    this.resizeImg(x, y, 'nw-resize', tempActiveObj);
                } else {
                    this.adjustNWPoints(actPoint, x, y, parent.activeObj.rotatedAngle);
                }
                if (actPoint.startX > actPoint.endX) {
                    const temp: number = actPoint.startX;
                    actPoint.startX = actPoint.endX;
                    actPoint.endX = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'ne-resize';
                }
                if (actPoint.startY > actPoint.endY) {
                    const temp: number = actPoint.startY;
                    actPoint.startY = actPoint.endY;
                    actPoint.endY = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'sw-resize';
                }
                this.revertResizing(tempActiveObj);
            }
            else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.startX < x && actPoint.startY < y) {
                    width = x - actPoint.startX; height = y - actPoint.startY;
                    scale = Math.min(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.startX += newScale.x; actPoint.startY += newScale.y;
                    const left: number = destLeft > 0 ? destLeft : 0;
                    const top: number = destTop > 0 ? destTop : 0;
                    if (actPoint.startX < left || actPoint.startY < top) {
                        actPoint.startX -= newScale.x; actPoint.startY -= newScale.y;
                    }
                } else {
                    width = actPoint.startX - x; height = y - actPoint.endY;
                    scale = Math.max(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.startX -= newScale.x; actPoint.startY -= newScale.y;
                    const left: number = destLeft > 0 ? destLeft : 0;
                    const top: number = destTop > 0 ? destTop : 0;
                    if (actPoint.startX < left || actPoint.startY < top) {
                        actPoint.startX += newScale.x; actPoint.startY += newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
            actPoint.width = actPoint.endX - actPoint.startX;
            actPoint.height = actPoint.endY - actPoint.startY;
            this.preventInverseResize(tempActiveObj);
        }
    }

    private updateNPoints(x: number, y: number): void {
        const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape !== 'text') {
            let splitWords: string[];
            if (parent.activeObj.shape) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape !== 'line' && parent.activeObj.shape !== 'arrow' && parent.activeObj.shape !== 'path' &&
                    parent.activeObj.rotatedAngle !== 0 && this.dragPoint.startX) {
                    if (this.dragPoint.startX && this.dragPoint.startY) {
                        this.previousPoint.x = this.dragPoint.endX; this.previousPoint.y = this.dragPoint.endY;
                        this.dragPoint.endX = x; this.dragPoint.endY = y;
                    }
                    width = (this.dragPoint.endX - this.previousPoint.x);
                    height = (this.dragPoint.endY - this.previousPoint.y);
                    this.adjustRotationPoints(actPoint, width, height, parent.activeObj.rotatedAngle);
                } else {
                    actPoint.startY = y;
                    actPoint.height = actPoint.endY - actPoint.startY;
                }
                if (actPoint.startY > actPoint.endY) {
                    const temp: number = actPoint.startY;
                    actPoint.startY = actPoint.endY;
                    actPoint.endY = temp;
                    this.dragElement = this.resizedElement = 's-resize';
                }
                this.revertResizing(tempActiveObj);
            }
            else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.endX > x && actPoint.startY < y) {
                    width = actPoint.endX - x; height = y - actPoint.startY;
                    scale = Math.min(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX -= newScale.x; actPoint.startY += newScale.y;
                    if (actPoint.endX > (destLeft + destWidth) ||
                        actPoint.startY < destTop) {
                        actPoint.endX += newScale.x; actPoint.startY -= newScale.y;
                    }
                } else {
                    width = x - actPoint.endX; height = actPoint.startY - y;
                    scale = Math.max(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX += newScale.x; actPoint.startY -= newScale.y;
                    if (actPoint.endX > (destLeft + destWidth) ||
                        actPoint.startY < destTop) {
                        actPoint.endX -= newScale.x; actPoint.startY += newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
        }
    }

    private updateNEPoints(x: number, y: number, maxDimension: Dimension): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape === 'text') {
            this.resizeImg(x, y, 'ne-resize', tempActiveObj);
            parent.notify('shape', { prop: 'updateFontSize', onPropertyChange: false,
                value: {obj: parent.activeObj}});
        } else {
            let splitWords: string[];
            if (parent.activeObj.shape) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape !== undefined && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape === 'image') {
                    this.resizeImg(x, y, 'ne-resize', tempActiveObj);
                } else {
                    this.adjustNEPoints(actPoint, x, y, parent.activeObj.rotatedAngle);
                }
                if (actPoint.endX < actPoint.startX) {
                    const temp: number = actPoint.endX;
                    actPoint.endX = actPoint.startX;
                    actPoint.startX = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'nw-resize';
                }
                if (actPoint.startY > actPoint.endY) {
                    const temp: number = actPoint.startY;
                    actPoint.startY = actPoint.endY;
                    actPoint.endY = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'se-resize';
                }
                this.revertResizing(tempActiveObj);
            }
            else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.endX > x && actPoint.startY < y) {
                    width = actPoint.endX - x; height = y - actPoint.startY;
                    scale = Math.min(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX -= newScale.x; actPoint.startY += newScale.y;
                    const endX: number = destLeft + destWidth < parent.lowerCanvas.width ?
                        destLeft + destWidth : parent.lowerCanvas.width;
                    const endY: number = destTop > 0 ? destTop : 0;
                    if (actPoint.endX > endX || actPoint.startY < endY) {
                        actPoint.endX += newScale.x; actPoint.startY -= newScale.y;
                    }
                } else {
                    width = x - actPoint.endX; height = actPoint.startY - y;
                    scale = Math.max(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX += newScale.x; actPoint.startY -= newScale.y;
                    const endX: number = destLeft + destWidth < parent.lowerCanvas.width ?
                        destLeft + destWidth : parent.lowerCanvas.width;
                    const endY: number = destTop > 0 ? destTop : 0;
                    if (actPoint.endX > endX || actPoint.startY < endY) {
                        actPoint.endX -= newScale.x; actPoint.startY += newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
            actPoint.width = actPoint.endX - actPoint.startX;
            actPoint.height = actPoint.endY - actPoint.startY;
            this.preventInverseResize(tempActiveObj);
        }
    }

    private updateWPoints(x: number, y: number): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape !== 'text') {
            let splitWords: string[];
            if (parent.activeObj.shape) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape !== 'line' && parent.activeObj.shape !== 'arrow' && parent.activeObj.shape !== 'path' &&
                    parent.activeObj.rotatedAngle !== 0 && this.dragPoint.startX) {
                    if (this.dragPoint.startX && this.dragPoint.startY) {
                        this.previousPoint.x = this.dragPoint.endX; this.previousPoint.y = this.dragPoint.endY;
                        this.dragPoint.endX = x; this.dragPoint.endY = y;
                    }
                    width = (this.dragPoint.endX - this.previousPoint.x);
                    height = (this.dragPoint.endY - this.previousPoint.y);
                    this.adjustRotationPoints(actPoint, width, height, parent.activeObj.rotatedAngle);
                } else {
                    actPoint.startX = x;
                    actPoint.width = actPoint.endX - actPoint.startX;
                }
                if (parent.activeObj.shape === 'line' || parent.activeObj.shape === 'arrow' || parent.activeObj.shape === 'path') {
                    actPoint.startY = y;
                    actPoint.height = actPoint.endY - actPoint.startY;
                    if (this.adjustActObjForLineArrow()) {
                        this.dragElement = 'e-resize';
                        if (parent.activeObj.triangleDirection === 'right') {
                            parent.activeObj.triangleDirection = 'left';
                        } else if (parent.activeObj.triangleDirection === 'left') {
                            parent.activeObj.triangleDirection = 'right';
                        }
                    }
                } else if (actPoint.startX > actPoint.endX) {
                    const temp: number = actPoint.startX;
                    actPoint.startX = actPoint.endX;
                    actPoint.endX = temp;
                    this.dragElement = this.resizedElement = 'e-resize';
                }
                this.revertResizing(tempActiveObj);
            }
            else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.startX < x && actPoint.endY > y) {
                    width = x - actPoint.startX; height = actPoint.endY - y;
                    scale = Math.min(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.startX += newScale.x; actPoint.endY -= newScale.y;
                    if (actPoint.startX < destLeft || actPoint.endY >
                        (destTop + destHeight)) {
                        actPoint.startX -= newScale.x; actPoint.endY += newScale.y;
                    }
                } else {
                    width = actPoint.startX - x; height = y - actPoint.endY;
                    scale = Math.max(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.startX -= newScale.x; actPoint.endY += newScale.y;
                    if (actPoint.startX < destLeft || actPoint.endY >
                        (destTop + destHeight)) {
                        actPoint.startX += newScale.x; actPoint.endY -= newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
        }
    }

    private updateEPoints(x: number, y: number): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape !== 'text') {
            let splitWords: string[];
            if (parent.activeObj.shape) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape !== 'line' && parent.activeObj.shape !== 'arrow' && parent.activeObj.shape !== 'path' &&
                    parent.activeObj.rotatedAngle !== 0 && this.dragPoint.startX) {
                    if (this.dragPoint.startX && this.dragPoint.startY) {
                        this.previousPoint.x = this.dragPoint.endX; this.previousPoint.y = this.dragPoint.endY;
                        this.dragPoint.endX = x; this.dragPoint.endY = y;
                    }
                    width = (this.dragPoint.endX - this.previousPoint.x);
                    height = (this.dragPoint.endY - this.previousPoint.y);
                    this.adjustRotationPoints(actPoint, width, height, parent.activeObj.rotatedAngle);
                } else {
                    actPoint.endX = x;
                    actPoint.width = actPoint.endX - actPoint.startX;
                }
                if (parent.activeObj.shape === 'line' || parent.activeObj.shape === 'arrow' || parent.activeObj.shape === 'path') {
                    actPoint.endY = y;
                    actPoint.height = actPoint.endY - actPoint.startY;
                    if (this.adjustActObjForLineArrow()) {
                        this.dragElement = 'w-resize';
                        if (parent.activeObj.triangleDirection === 'right') {
                            parent.activeObj.triangleDirection = 'left';
                        } else if (parent.activeObj.triangleDirection === 'left') {
                            parent.activeObj.triangleDirection = 'right';
                        }
                    }
                } else if (actPoint.endX < actPoint.startX) {
                    const temp: number = actPoint.endX;
                    actPoint.endX = actPoint.startX;
                    actPoint.startX = temp;
                    this.dragElement = this.resizedElement = 'w-resize';
                }
                this.revertResizing(tempActiveObj);
            }
            else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.endX > x && actPoint.endY > y) {
                    width = actPoint.endX - x; height = actPoint.endY - y;
                    scale = Math.min(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX -= newScale.x; actPoint.endY -= newScale.y;
                    if (actPoint.endX > (destLeft + destWidth) ||
                        actPoint.endY > (destTop + destHeight)) {
                        actPoint.endX += newScale.x; actPoint.endY += newScale.y;
                    }
                } else {
                    width = x - actPoint.endX; height = y - actPoint.endY;
                    scale = Math.max(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX += newScale.x; actPoint.endY += newScale.y;
                    if (actPoint.endX > (destLeft + destWidth) ||
                    actPoint.endY > (destTop + destHeight)) {
                        actPoint.endX -= newScale.x; actPoint.endY -= newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
        }
    }

    private updateSWPoints(x: number, y: number, maxDimension: Dimension): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape === 'text') {
            this.resizeImg(x, y, 'sw-resize', tempActiveObj);
            parent.notify('shape', { prop: 'updateFontSize', onPropertyChange: false,
                value: {obj: parent.activeObj}});
        } else {
            let splitWords: string[];
            if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape !== undefined && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape === 'image') {
                    this.resizeImg(x, y, 'sw-resize', tempActiveObj);
                } else {
                    this.adjustSWPoints(actPoint, x, y, parent.activeObj.rotatedAngle);
                }
                if (actPoint.startX > actPoint.endX) {
                    const temp: number = actPoint.startX;
                    actPoint.startX = actPoint.endX;
                    actPoint.endX = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'se-resize';
                }
                if (actPoint.endY < actPoint.startY) {
                    const temp: number = actPoint.endY;
                    actPoint.endY = actPoint.startY;
                    actPoint.startY = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'nw-resize';
                }
                this.revertResizing(tempActiveObj);
            } else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.startX < x && actPoint.endY > y) {
                    width = x - actPoint.startX; height = actPoint.endY - y;
                    scale = Math.min(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.startX += newScale.x; actPoint.endY -= newScale.y;
                    const endX: number = destLeft > 0 ? destLeft : 0;
                    const endY: number = destTop + destHeight < parent.lowerCanvas.height ? destTop +
                                         destHeight : parent.lowerCanvas.height;
                    if (actPoint.startX < endX || actPoint.endY > endY) {
                        actPoint.startX -= newScale.x; actPoint.endY += newScale.y;
                    }
                } else {
                    width = actPoint.startX - x; height = y - actPoint.endY;
                    scale = Math.max(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.startX -= newScale.x; actPoint.endY += newScale.y;
                    const endX: number = destLeft > 0 ? destLeft : 0;
                    const endY: number = destTop + destHeight < parent.lowerCanvas.height ? destTop +
                                         destHeight : parent.lowerCanvas.height;
                    if (actPoint.startX < endX || actPoint.endY > endY) {
                        actPoint.startX += newScale.x; actPoint.endY -= newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
            actPoint.width = actPoint.endX - actPoint.startX;
            actPoint.height = actPoint.endY - actPoint.startY;
            this.preventInverseResize(tempActiveObj);
        }
    }

    private updateSPoints(x: number, y: number): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape !== 'text') {
            let splitWords: string[];
            if (parent.activeObj.shape) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape !== 'line' && parent.activeObj.shape !== 'arrow' && parent.activeObj.shape !== 'path' &&
                    parent.activeObj.rotatedAngle !== 0 && this.dragPoint.startX) {
                    if (this.dragPoint.startX && this.dragPoint.startY) {
                        this.previousPoint.x = this.dragPoint.endX; this.previousPoint.y = this.dragPoint.endY;
                        this.dragPoint.endX = x; this.dragPoint.endY = y;
                    }
                    width = (this.dragPoint.endX - this.previousPoint.x);
                    height = (this.dragPoint.endY - this.previousPoint.y);
                    this.adjustRotationPoints(actPoint, width, height, parent.activeObj.rotatedAngle);
                } else {
                    actPoint.endY = y;
                    actPoint.height = actPoint.endY - actPoint.startY;
                }
                if (actPoint.endY < actPoint.startY) {
                    const temp: number = actPoint.endY;
                    actPoint.endY = actPoint.startY;
                    actPoint.startY = temp;
                    this.dragElement = this.resizedElement = 'n-resize';
                }
                this.revertResizing(tempActiveObj);
            }
            else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.endX > x && actPoint.endY > y) {
                    width = actPoint.endX - x;
                    height = actPoint.endY - y;
                    scale = Math.min(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX -= newScale.x; actPoint.endY -= newScale.y;
                    if (actPoint.endX > (destLeft + destWidth) ||
                        actPoint.endY > (destTop + destHeight)) {
                        actPoint.endX += newScale.x; actPoint.endY += newScale.y;
                    }
                } else {
                    width = x - actPoint.endX; height = y - actPoint.endY;
                    scale = Math.max(width, height);
                    const newScale: Point = this.getScaleRatio(scale);
                    actPoint.endX += newScale.x; actPoint.endY += newScale.x;
                    if (actPoint.endX > (destLeft + destWidth) ||
                        actPoint.endY > (destTop + destHeight)) {
                        actPoint.endX -= newScale.x; actPoint.endY -= newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
        }
    }

    private updateSEPoints(x: number, y: number, maxDimension: Dimension): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number;
        const tempActiveObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (parent.activeObj.shape === 'text') {
            this.resizeImg(x, y, 'se-resize', tempActiveObj);
            parent.notify('shape', { prop: 'updateFontSize', onPropertyChange: false,
                value: {obj: parent.activeObj}});
        } else {
            let splitWords: string[]; let newScale: Point;
            if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
            if (parent.activeObj.shape === 'crop-custom' || (parent.activeObj.shape !== undefined && splitWords[0] !== 'crop')) {
                if (parent.activeObj.shape === 'image') {
                    this.resizeImg(x, y, 'se-resize', tempActiveObj);
                } else {
                    this.adjustSEPoints(actPoint, x, y, parent.activeObj.rotatedAngle);
                }
                if (actPoint.endX < actPoint.startX) {
                    const temp: number = actPoint.endX;
                    actPoint.endX = actPoint.startX;
                    actPoint.startX = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'sw-resize';
                }
                if (actPoint.endY < actPoint.startY) {
                    const temp: number = actPoint.endY;
                    actPoint.endY = actPoint.startY;
                    actPoint.startY = temp;
                    this.dragElement = parent.upperCanvas.style.cursor = parent.cursor = 'ne-resize';
                }
                this.revertResizing(tempActiveObj);
            } else {
                const { destLeft, destTop, destWidth, destHeight } = parent.img;
                if (actPoint.endX > x && actPoint.endY > y) {
                    width = actPoint.endX - x; height = actPoint.endY - y;
                    scale = Math.min(width, height);
                    newScale = this.getScaleRatio(scale);
                    actPoint.endX -= newScale.x; actPoint.endY -= newScale.y;
                    const endX: number = destLeft + destWidth < parent.lowerCanvas.width ?
                        destLeft + destWidth : parent.lowerCanvas.width;
                    const endY: number = destTop + destHeight < parent.lowerCanvas.height ?
                        destTop + destHeight : parent.lowerCanvas.height;
                    if (actPoint.endX > endX || actPoint.endY > endY) {
                        actPoint.endX += newScale.x; actPoint.endY += newScale.y;
                    }
                } else {
                    width = x - actPoint.endX; height = y - actPoint.endY;
                    scale = Math.max(width, height);
                    newScale = this.getScaleRatio(scale);
                    actPoint.endX += newScale.x; actPoint.endY += newScale.y;
                    const endX: number = destLeft + destWidth < parent.lowerCanvas.width ? destLeft +
                                         destWidth : parent.lowerCanvas.width;
                    const endY: number = destTop + destHeight < parent.lowerCanvas.height ? destTop +
                                         destHeight : parent.lowerCanvas.height;
                    if (actPoint.endX > endX || actPoint.endY > endY) {
                        actPoint.endX -= newScale.x; actPoint.endY -= newScale.y;
                    }
                }
                actPoint.width = actPoint.endX - actPoint.startX;
                actPoint.height = actPoint.endY - actPoint.startY;
                this.revertResizing(tempActiveObj);
            }
            this.preventInverseResize(tempActiveObj);
        }
    }

    private resizeImg(x: number, y: number, elem: string, tempActiveObj: SelectionPoint): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        let width: number; let height: number; let scale: number; let newScale: Point;
        if (this.previousPoint.x !== 0 && this.previousPoint.y !== 0) {
            switch (parent.upperCanvas.style.cursor) {
            case 'se-resize':
            case 's-resize':
                if (this.previousPoint.x > x || this.previousPoint.y > y) {
                    width = (this.previousPoint.x - x);
                    height = (this.previousPoint.y - y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, -Math.abs(newScale.x), -Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                else if (this.previousPoint.x !== 0 && this.previousPoint.y !== 0) {
                    width = (x - this.previousPoint.x);
                    height = (y - this.previousPoint.y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, Math.abs(newScale.x), Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                break;
            case 'sw-resize':
                if (this.previousPoint.x < x || this.previousPoint.y > y) {
                    width = (x - this.previousPoint.x);
                    height = (this.previousPoint.y - y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, -Math.abs(newScale.x), -Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                else if (this.previousPoint.x !== 0 && this.previousPoint.y !== 0) {
                    width = (this.previousPoint.x - x);
                    height = (y - this.previousPoint.y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, Math.abs(newScale.x), Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                break;
            case 'w-resize':
            case 'nw-resize':
                if (this.previousPoint.x < x || this.previousPoint.y < y) {
                    width = (x - this.previousPoint.x);
                    height = (y - this.previousPoint.y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, -Math.abs(newScale.x), -Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                else if (this.previousPoint.x !== 0 && this.previousPoint.y !== 0) {
                    width = (this.previousPoint.x - x);
                    height = (this.previousPoint.y - y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, Math.abs(newScale.x), Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                break;
            case 'n-resize':
            case 'ne-resize':
                if (this.previousPoint.x > x || this.previousPoint.y < y) {
                    width = (this.previousPoint.x - x);
                    height = (y - this.previousPoint.y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, -Math.abs(newScale.x), -Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                else if (this.previousPoint.x !== 0 && this.previousPoint.y !== 0) {
                    width = (x - this.previousPoint.x);
                    height = (this.previousPoint.y - y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, Math.abs(newScale.x), Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                break;
            case 'e-resize':
                if (this.previousPoint.x > x || this.previousPoint.y > y) {
                    width = (this.previousPoint.x - x);
                    height = (this.previousPoint.y - y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, -Math.abs(newScale.x), -Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                else if (this.previousPoint.x !== 0 && this.previousPoint.y !== 0) {
                    width = (x - this.previousPoint.x);
                    height = (y - this.previousPoint.y);
                    scale = (width + height) / 2;
                    newScale = this.getScaleRatio(scale);
                    this.adjustRotationPoints(actPoint, Math.abs(newScale.x), Math.abs(newScale.y),
                                              parent.activeObj.rotatedAngle, 'img-resize', elem);
                }
                break;
            }
            actPoint.width = actPoint.endX - actPoint.startX;
            actPoint.height = actPoint.endY - actPoint.startY;
            if ((actPoint.width < 10 || actPoint.height < 10) ||
                (parent.activeObj.shape === 'text' && parent.activeObj.rotatedAngle === 0 && this.preventTextDraggingInvertly())) {
                parent.activeObj = extend({}, tempActiveObj, null, true) as SelectionPoint;
            }
        }
        this.previousPoint = { x: x, y: y };
    }

    private adjustNWPoints(rectangle: ActivePoint, x: number, y: number, angle: number): ActivePoint {
        const cx: number = rectangle.startX + rectangle.width / 2;
        const cy: number = rectangle.startY + rectangle.height / 2;
        const rotatedC: number[] = this.rotatePoints(rectangle.endX, rectangle.endY, cx, cy, angle);
        const newCenter: number[] = [(rotatedC[0] + x) / 2, (rotatedC[1] + y) / 2];
        const newBottomRight: number[] = this.rotatePoints(rotatedC[0], rotatedC[1], newCenter[0], newCenter[1], -angle);
        const newTopLeft: number[] = this.rotatePoints(x, y, newCenter[0], newCenter[1], -angle);
        rectangle.endX = newBottomRight[0];
        rectangle.endY = newBottomRight[1];
        rectangle.startY = newTopLeft[1];
        rectangle.startX = newTopLeft[0];
        rectangle.width = rectangle.endX - rectangle.startX;
        rectangle.height = rectangle.endY - rectangle.startY;
        return rectangle;
    }

    private adjustNEPoints(rectangle: ActivePoint, x: number, y: number, angle: number): ActivePoint {
        const cx: number = rectangle.startX + rectangle.width / 2;
        const cy: number = rectangle.startY + rectangle.height / 2;
        const rotatedD: number[] = this.rotatePoints(rectangle.startX, rectangle.endY, cx, cy, angle);
        const newCenter: number[] = [(rotatedD[0] + x) / 2, (rotatedD[1] + y) / 2];
        const newBottomLeft: number[] = this.rotatePoints(rotatedD[0], rotatedD[1], newCenter[0], newCenter[1], -angle);
        const newTopRight: number[] = this.rotatePoints(x, y, newCenter[0], newCenter[1], -angle);
        rectangle.startX = newBottomLeft[0];
        rectangle.endY = newBottomLeft[1];
        rectangle.width = newTopRight[0] - newBottomLeft[0];
        rectangle.height = newBottomLeft[1] - newTopRight[1];
        rectangle.endX = rectangle.startX + rectangle.width;
        rectangle.startY = rectangle.endY - rectangle.height;
        return rectangle;
    }

    private adjustSWPoints(rectangle: ActivePoint, x: number, y: number, angle: number): ActivePoint {
        const cx: number = rectangle.startX + rectangle.width / 2;
        const cy: number = rectangle.startY + rectangle.height / 2;
        const rotatedB: number[] = this.rotatePoints(rectangle.endX, rectangle.startY, cx, cy, angle);
        const newCenter: number[] = [(rotatedB[0] + x) / 2, (rotatedB[1] + y) / 2];
        const newTopRight: number[] = this.rotatePoints(rotatedB[0], rotatedB[1], newCenter[0], newCenter[1], -angle);
        const newBottomLeft: number[] = this.rotatePoints(x, y, newCenter[0], newCenter[1], -angle);
        rectangle.endX = newTopRight[0];
        rectangle.startY = newTopRight[1];
        rectangle.startX = newBottomLeft[0];
        rectangle.endY = newBottomLeft[1];
        rectangle.width = rectangle.endX - rectangle.startX;
        rectangle.height = rectangle.endY - rectangle.startY;
        return rectangle;
    }

    private adjustSEPoints(rectangle: ActivePoint, x: number, y: number, angle: number): ActivePoint {
        const cx: number = rectangle.startX + rectangle.width / 2;
        const cy: number = rectangle.startY + rectangle.height / 2;
        const rotatedA: number[] = this.rotatePoints(rectangle.startX, rectangle.startY, cx, cy, angle);
        const newCenter: number[] = [(rotatedA[0] + x) / 2, (rotatedA[1] + y) / 2];
        const newTopLeft: number[] = this.rotatePoints(rotatedA[0], rotatedA[1], newCenter[0], newCenter[1], -angle);
        const newBottomRight: number[] = this.rotatePoints(x, y, newCenter[0], newCenter[1], -angle);
        rectangle.startX = newTopLeft[0];
        rectangle.startY = newTopLeft[1];
        rectangle.width = newBottomRight[0] - newTopLeft[0];
        rectangle.height = newBottomRight[1] - newTopLeft[1];
        rectangle.endX = rectangle.startX + rectangle.width;
        rectangle.endY = rectangle.startY + rectangle.height;
        return rectangle;
    }

    private adjustRotationPoints(rectangle: ActivePoint, x: number, y: number, angle: number, type?: string,
                                 elem?: string): ActivePoint {
        const cx: number = rectangle.startX + rectangle.width / 2;
        const cy: number = rectangle.startY + rectangle.height / 2;
        this.getResizeDirection(rectangle, x, y , angle, type, elem);
        const rotatedA: number[] = this.rotatePoints(rectangle.startX, rectangle.startY, cx, cy, angle);
        const rotatedB: number[] = this.rotatePoints(rectangle.endX, rectangle.startY, cx, cy, angle);
        const rotatedC: number[] = this.rotatePoints(rectangle.endX, rectangle.endY, cx, cy, angle);
        const rotatedD: number[] = this.rotatePoints(rectangle.startX, rectangle.endY, cx, cy, angle);
        const newCenter: number[] = [(rotatedA[0] + rotatedC[0]) / 2, (rotatedA[1] + rotatedC[1]) / 2];
        const newTopLeft: number[] = this.rotatePoints(rotatedA[0], rotatedA[1], newCenter[0], newCenter[1], -angle);
        const newBottomLeft: number[] = this.rotatePoints(rotatedD[0], rotatedD[1], newCenter[0], newCenter[1], -angle);
        const newTopRight: number[] = this.rotatePoints(rotatedB[0], rotatedB[1], newCenter[0], newCenter[1], -angle);
        rectangle.startX = newTopLeft[0];
        rectangle.startY = newTopLeft[1];
        rectangle.endX = newTopRight[0];
        rectangle.endY = newBottomLeft[1];
        rectangle.width = rectangle.endX - rectangle.startX;
        rectangle.height = rectangle.endY - rectangle.startY;
        return rectangle;
    }

    private rotatePoints(x: number, y: number, cx: number, cy: number, angle: number): number[] {
        return [
            (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
            (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy
        ];
    }

    private setResizedValue(element: string, value: number, x: number, y: number): number {
        switch (element) {
        case 'x':
            value += x;
            break;
        case 'y':
            value += y;
            break;
        case 'abs-x':
            value += (x > 0 ? -x : Math.abs(x));
            break;
        case 'abs-y':
            value += (y > 0 ? -y : Math.abs(y));
            break;
        case 'y-abs-x':
            value += (y + ((x > 0 ? -x : Math.abs(x)) / 2));
            break;
        case 'abs-x-abs-y':
            value += ((x > 0 ? -x : Math.abs(x)) + ((y > 0 ? -y : Math.abs(y)) / 2));
            break;
        case 'abs-y-x':
            value += ((y > 0 ? -y : Math.abs(y)) + (x / 2));
            break;
        case 'x-y':
            value += (x + (y / 2));
            break;
        case 'y-x':
            value += (y + (x / 2));
            break;
        case 'img-resize-x':
            value += x;
            break;
        case 'img-resize-y':
            value += y;
            break;
        }
        return value;
    }

    private getResizeDirection(rectangle: ActivePoint, x: number, y: number, angle: number, type?: string, elem?: string): void {
        const rotatedAngle: number = angle * (180 / Math.PI);
        const element: string = this.getResizedElement(rotatedAngle, this.resizedElement);
        if (this.resizedElement === 'e-resize') {
            rectangle.width = this.setResizedValue(element, rectangle.width, x, y);
            rectangle.endX = rectangle.width + rectangle.startX;
        } else if (this.resizedElement === 'n-resize') {
            rectangle.startY = this.setResizedValue(element, rectangle.startY, x, y);
            rectangle.height = rectangle.endY - rectangle.startY;
        } else if (this.resizedElement === 'w-resize') {
            rectangle.startX = this.setResizedValue(element, rectangle.startX, x, y);
            rectangle.width = rectangle.startX + rectangle.endX;
        } else if (this.resizedElement === 's-resize') {
            rectangle.height = this.setResizedValue(element, rectangle.height, x, y);
            rectangle.endY = rectangle.height + rectangle.startY;
        } else if (type && type === 'img-resize') {
            rectangle.width = this.setResizedValue('img-resize-x', rectangle.width, x, y);
            rectangle.height = this.setResizedValue('img-resize-y', rectangle.height, x, y);
            if (elem === 'se-resize') {
                rectangle.endX = rectangle.width + rectangle.startX;
                rectangle.endY = rectangle.height + rectangle.startY;
            } else if (elem === 'sw-resize') {
                rectangle.startX = rectangle.endX - rectangle.width;
                rectangle.endY = rectangle.height + rectangle.startY;
            } else if (elem === 'ne-resize') {
                rectangle.endX = rectangle.width + rectangle.startX;
                rectangle.startY = rectangle.endY - rectangle.height;
            } else if (elem === 'nw-resize') {
                rectangle.startX = rectangle.endX - rectangle.width;
                rectangle.startY = rectangle.endY - rectangle.height;
            }
        } else if (type && type === 'text') {
            if (elem === 'widthHeight') {
                rectangle.width = this.setResizedValue('x-y', rectangle.width, x, y);
                rectangle.endX = rectangle.width + rectangle.startX;
                rectangle.height = this.setResizedValue('y-x', rectangle.height, x, y);
                rectangle.endY = rectangle.height + rectangle.startY;
            } else if (elem === 'width') {
                rectangle.width = this.setResizedValue('x-y', rectangle.width, x, y);
                rectangle.endX = rectangle.width + rectangle.startX;
            } else if (elem === 'height') {
                rectangle.height = this.setResizedValue('y-abs-x', rectangle.height, x, y);
                rectangle.endY = rectangle.height + rectangle.startY;
            }
        }
    }

    private getResizedElement(degree: number, element: string): string {
        let resizeMappings: [number, number, string][] = [];
        if (element === 'n-resize') {
            resizeMappings = [
                [337.5, 360, 'y'],
                [0, 22.5, 'y'],
                [22.5, 67.5, 'y-abs-x'],
                [67.5, 112.5, 'abs-x'],
                [112.5, 157.5, 'abs-x-abs-y'],
                [157.5, 202.5, 'abs-y'],
                [202.5, 247.5, 'abs-y-x'],
                [247.5, 292.5, 'x'],
                [292.5, 337.5, 'x-y']
            ];
        } else if (element === 'e-resize') {
            resizeMappings = [
                [337.5, 360, 'x'],
                [0, 22.5, 'x'],
                [22.5, 67.5, 'x-y'],
                [67.5, 112.5, 'y'],
                [112.5, 157.5, 'y-abs-x'],
                [157.5, 202.5, 'abs-x'],
                [202.5, 247.5, 'abs-x-abs-y'],
                [247.5, 292.5, 'abs-y'],
                [292.5, 337.5, 'abs-y-x']
            ];
        } else if (element === 's-resize') {
            resizeMappings = [
                [337.5, 360, 'y'],
                [0, 22.5, 'y'],
                [22.5, 67.5, 'y-abs-x'],
                [67.5, 112.5, 'abs-x'],
                [112.5, 157.5, 'abs-x-abs-y'],
                [157.5, 202.5, 'abs-y'],
                [202.5, 247.5, 'abs-y-x'],
                [247.5, 292.5, 'x'],
                [292.5, 337.5, 'x-y']
            ];
        } else if (element === 'w-resize') {
            resizeMappings = [
                [337.5, 360, 'x'],
                [0, 22.5, 'x'],
                [22.5, 67.5, 'x-y'],
                [67.5, 112.5, 'y'],
                [112.5, 157.5, 'y-abs-x'],
                [157.5, 202.5, 'abs-x'],
                [202.5, 247.5, 'abs-x-abs-y'],
                [247.5, 292.5, 'abs-y'],
                [292.5, 337.5, 'abs-y-x']
            ];
        }
        const positiveDegree: number = degree < 0 ? 360 - Math.abs(degree) : degree;
        for (const [startDegree, endDegree, resizeElement] of resizeMappings) {
            if ((positiveDegree > startDegree && positiveDegree <= endDegree) ||
                (positiveDegree + 360 > startDegree && positiveDegree + 360 <= endDegree)) {
                return resizeElement;
            }
        }
        return element;
    }

    private updateCursorStyles(x: number, y: number, type: string): void {
        const parent: ImageEditor = this.parent;
        let isResize: boolean = false;
        if (parent.activeObj.keyHistory !== '' && parent.activeObj.shape === undefined && !parent.currObjType.isCustomCrop &&
            !parent.currObjType.isLine && parent.currObjType.isText) {
            parent.activeObj.shape = 'text';
        }
        const actObj: SelectionPoint = extend({}, parent.activeObj, {}, true) as SelectionPoint;
        if (isNullOrUndefined(actObj.topLeftCircle)) {
            return;
        }
        let degree: number;
        if (actObj.shapeDegree === 0) {degree = parent.transform.degree; }
        else {degree = parent.transform.degree - actObj.shapeDegree; }
        if (degree < 0) {degree = 360 + degree; }
        if (this.isObjSelected) {
            if (actObj.shape === 'line' || actObj.shape === 'arrow') {
                isResize = this.updateCursorStylesForLineArrow(x, y, actObj);
            } else if (actObj.shape === 'path') {
                isResize = this.updateCursorStylesForPath(x, y, actObj);
            } else if (actObj.rotatedAngle) {
                this.setCursorForRotatedObject(actObj, x, y, parent.upperCanvas);
                if (parent.cursor === 'grabbing') {
                    parent.upperCanvas.style.cursor = parent.cursor = 'grabbing';
                    this.dragElement = parent.cursor;
                } else if (parent.cursor === 'move') {
                    this.dragPoint.startX = this.previousPoint.x = this.dragPoint.endX = x;
                    this.dragPoint.startY = this.previousPoint.y = this.dragPoint.endY = y;
                } else if (parent.cursor !== 'default') {
                    isResize = true; this.dragElement = parent.cursor;
                    parent.currObjType.isResize = true;
                }
            } else {
                const rotationCirclePoint: Point = this.getTransRotationPoint(actObj);
                const radius: number = actObj.topLeftCircle.radius;
                if (x >= (actObj.topLeftCircle.startX - (radius * 2)) &&
                    x <= (actObj.topLeftCircle.startX + (radius * 2)) &&
                    y >= (actObj.topLeftCircle.startY - (radius * 2)) &&
                    y <= (actObj.topLeftCircle.startY + (radius * 2)) && this.dragElement !== 'nw-resize') {
                    actObj.topLeftCircle.startX = actObj.topLeftCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 'nw-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (x >= (actObj.topLeftCircle.startX - (radius * 2)) &&
                    x <= (actObj.topRightCircle.startX - (radius * 2)) &&
                    y >= (actObj.topCenterCircle.startY - (radius * 2)) &&
                    y <= (actObj.topCenterCircle.startY + (radius * 2)) && this.dragElement !== 'n-resize') {
                    actObj.topCenterCircle.startX = actObj.topCenterCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 'n-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (x >= (actObj.topRightCircle.startX - (radius * 2)) &&
                        x <= (actObj.topRightCircle.startX + (radius * 2)) &&
                        y >= (actObj.topRightCircle.startY - (radius * 2)) &&
                        y <= (actObj.topRightCircle.startY + (radius * 2)) && this.dragElement !== 'ne-resize') {
                    actObj.topRightCircle.startX = actObj.topRightCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 'ne-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (x >= (actObj.centerLeftCircle.startX - (radius * 2)) &&
                        x <= (actObj.centerLeftCircle.startX + (radius * 2)) &&
                        y >= (actObj.topLeftCircle.startY - (radius * 2)) &&
                        y <= (actObj.bottomLeftCircle.startY - (radius * 2)) && this.dragElement !== 'w-resize') {
                    actObj.centerLeftCircle.startX = actObj.centerLeftCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 'w-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (x >= (actObj.centerRightCircle.startX - (radius * 2)) &&
                        x <= (actObj.centerRightCircle.startX + (radius * 2)) &&
                        y >= (actObj.topRightCircle.startY - (radius * 2)) &&
                        y <= (actObj.bottomRightCircle.startY - (radius * 2)) && this.dragElement !== 'e-resize') {
                    actObj.centerRightCircle.startX = actObj.centerRightCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 'e-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (x >= (actObj.bottomLeftCircle.startX - (radius * 2)) &&
                        x <= (actObj.bottomLeftCircle.startX + (radius * 2)) &&
                        y >= (actObj.bottomLeftCircle.startY - (radius * 2)) &&
                        y <= (actObj.bottomLeftCircle.startY + (radius * 2)) && this.dragElement !== 'sw-resize') {
                    actObj.bottomLeftCircle.startX = actObj.bottomLeftCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 'sw-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (x >= (actObj.bottomLeftCircle.startX - (radius * 2)) &&
                        x <= (actObj.bottomRightCircle.startX - (radius * 2)) &&
                        y >= (actObj.bottomCenterCircle.startY - (radius * 2)) &&
                        y <= (actObj.bottomCenterCircle.startY + (radius * 2)) && this.dragElement !== 's-resize') {
                    actObj.bottomCenterCircle.startX = actObj.bottomCenterCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 's-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (x >= (actObj.bottomRightCircle.startX - (radius * 2)) &&
                        x <= (actObj.bottomRightCircle.startX + (radius * 2)) &&
                        y >= (actObj.bottomRightCircle.startY - (radius * 2)) &&
                        y <= (actObj.bottomRightCircle.startY + (radius * 2)) && this.dragElement !== 'se-resize') {
                    actObj.bottomRightCircle.startX = actObj.bottomRightCircle.startY = 0;
                    parent.upperCanvas.style.cursor = parent.cursor = 'se-resize'; isResize = true;
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else if (rotationCirclePoint &&
                        x >= rotationCirclePoint.x - (radius * 2) &&
                        x <= rotationCirclePoint.x + (radius * 2) &&
                        y >= rotationCirclePoint.y - (radius * 2) &&
                        y <= rotationCirclePoint.y + (radius * 2) && this.dragElement !== 'grabbing') {
                    parent.upperCanvas.style.cursor = parent.cursor = 'grabbing';
                    this.dragElement = parent.upperCanvas.style.cursor;
                } else {
                    this.dragPoint.startX = this.previousPoint.x = this.dragPoint.endX = x;
                    this.dragPoint.startY = this.previousPoint.y = this.dragPoint.endY = y;
                }
                if ((actObj.shape === 'text') && (parent.cursor === 'n-resize' ||
                    parent.cursor === 's-resize' || parent.cursor === 'e-resize' ||
                    parent.cursor === 'w-resize')) {
                    parent.upperCanvas.style.cursor = parent.cursor = 'move'; this.dragElement = '';
                    this.dragPoint.startX = this.previousPoint.x = this.dragPoint.endX = x;
                    this.dragPoint.startY = this.previousPoint.y = this.dragPoint.endY = y;
                }
            }
        } else {
            this.dragPoint.startX = this.previousPoint.x = this.dragPoint.endX = x;
            this.dragPoint.startY = this.previousPoint.y = this.dragPoint.endY = y;
        }
        this.previousPoint.x = this.previousPoint.y = this.diffPoint.x = this.diffPoint.y = 0;
        if (type === 'touchstart') {
            if (isResize || (x >= actObj.activePoint.startX && x <= actObj.activePoint.endX
                && y >= actObj.activePoint.startY && y <= actObj.activePoint.endY) || this.dragElement === 'grabbing') {
                parent.currObjType.isDragging = true;
            } else if (actObj.shape === 'line' || actObj.shape === 'arrow') {
                this.setCursorForLineArrow(actObj, x, y, parent.upperCanvas);
                if (parent.cursor === 'move') {
                    parent.currObjType.isDragging = true;
                }
            } else if (actObj.shape === 'path') {
                this.setCursorForPath(actObj, x, y, parent.upperCanvas);
                if (parent.cursor === 'move') {
                    parent.currObjType.isDragging = true;
                }
            }
        } else {
            parent.currObjType.isDragging = true;
        }
        if (actObj.rotatedAngle !== 0 && (this.dragElement === 'e-resize' ||
            this.dragElement === 'w-resize' || this.dragElement === 'n-resize' ||
            this.dragElement === 's-resize')) {
            this.dragPoint.startX = this.previousPoint.x = this.dragPoint.endX = x;
            this.dragPoint.startY = this.previousPoint.y = this.dragPoint.endY = y;
        }
    }

    private updateCursorStylesForLineArrow(x: number, y: number, actObj: SelectionPoint): boolean {
        let isResize: boolean = false;
        const parent: ImageEditor = this.parent;
        let point: Point; const radius: number = actObj.topLeftCircle.radius;
        for (let i: number = 0; i < 5; i++) {
            point = actObj.pointColl[i as number];
            if (x >= (point.x - (radius * 2)) && x <= (point.x + (radius * 2)) &&
                y >= (point.y - (radius * 2)) && y <= (point.y + (radius * 2))) {
                actObj.centerLeftCircle.startX = actObj.centerLeftCircle.startY = 0;
                this.dragElement = 'w-resize'; isResize = true;
                break;
            }
        }
        if (!isResize) {
            for (let i: number = 1; i < 6; i++) {
                point = actObj.pointColl[actObj.pointColl.length - i as number];
                if (x >= (point.x - (radius * 2)) && x <= (point.x + (radius * 2)) &&
                    y >= (point.y - (radius * 2)) && y <= (point.y + (radius * 2))) {
                    actObj.centerRightCircle.startX = actObj.centerRightCircle.startY = 0;
                    this.dragElement = 'e-resize'; isResize = true;
                    break;
                }
            }
        }
        if (!isResize) {
            for (let i: number = 0; i < actObj.pointColl.length; i++) {
                point = actObj.pointColl[i as number];
                if (x >= (point.x - (radius * 2)) && x <= (point.x + (radius * 2)) &&
                    y >= (point.y - (radius * 2)) && y <= (point.y + (radius * 2))) {
                    parent.upperCanvas.style.cursor = parent.cursor = 'move';
                    this.dragPoint.startX = this.previousPoint.x = this.dragPoint.endX = x;
                    this.dragPoint.startY = this.previousPoint.y = this.dragPoint.endY = y;
                    break;
                } else {
                    parent.upperCanvas.style.cursor = parent.cursor = 'default';
                }
            }
        }
        return isResize;
    }

    private updateCursorStylesForPath(x: number, y: number, actObj: SelectionPoint): boolean {
        let isResize: boolean = false; const parent: ImageEditor = this.parent;
        this.pathAdjustedIndex = this.setCursorForLineArrow(actObj, x, y, parent.upperCanvas);
        if (parent.cursor === 'move') {
            isResize = true;
            this.dragElement = 'pathDrag';
        }
        if (!isResize) {
            parent.upperCanvas.style.cursor = parent.cursor = 'move';
            this.dragPoint.startX = this.previousPoint.x = this.dragPoint.endX = x;
            this.dragPoint.startY = this.previousPoint.y = this.dragPoint.endY = y;
        }
        return isResize;
    }

    private setTextSelection(width: number, height: number): void {
        const parent: ImageEditor = this.parent; let actPoint: ActivePoint = parent.activeObj.activePoint;
        let degree: number = parent.transform.degree;
        if (parent.activeObj.shapeDegree === 0) {degree = parent.transform.degree; }
        else {degree =  parent.transform.degree - parent.activeObj.shapeDegree; }
        if (degree < 0) {degree = 360 + degree; }
        for (let i: number = 0, len: number = parent.activeObj.flipObjColl.length; i < len; i++) {
            const flip: string = parent.activeObj.flipObjColl[i as number].toLowerCase();
            switch (degree) {
            case 0:
                switch (flip) {
                case 'horizontal':
                    actPoint = { startX: actPoint.endX - width, startY: actPoint.startY, endX: (actPoint.endX),
                        endY: actPoint.startY + (height ? height : 0) };
                    break;
                case 'vertical':
                    actPoint.startY = actPoint.endY - height;
                    actPoint = { startX: actPoint.startX, startY: actPoint.startY, endX: (actPoint.startX + (width ? width : 0)),
                        endY: actPoint.endY };
                    break;
                default:
                    actPoint = { startX: actPoint.startX,
                        startY: actPoint.startY, endX: (actPoint.startX + (width ? width : 0)), endY: actPoint.startY +
                        (height ? height : 0) };
                    break;
                }
                break;
            case 90:
                switch (flip) {
                case 'horizontal':
                    actPoint.endX = actPoint.startX + height;
                    actPoint = { startX: actPoint.startX, startY: actPoint.startY, endX: (actPoint.endX),
                        endY: actPoint.startY + (width ? width : 0) };
                    break;
                case 'vertical':
                    actPoint.startX = actPoint.endX - height;
                    actPoint = { startX: actPoint.startX, startY: actPoint.endY - width, endX: (actPoint.endX), endY: actPoint.endY};
                    break;
                default:
                    actPoint.startX = actPoint.endX - height;
                    actPoint = { startX: actPoint.startX, startY: actPoint.startY, endX: (actPoint.endX),
                        endY: actPoint.startY + (width ? width : 0) };
                    break;
                }
                break;
            case 180:
                switch (flip) {
                case 'horizontal':
                    actPoint.startY = actPoint.endY - height;
                    actPoint = { startX: actPoint.startX, startY: actPoint.startY, endX: (actPoint.startX + width),
                        endY: actPoint.endY };
                    break;
                case 'vertical':
                    actPoint.endY = actPoint.startY + height;
                    actPoint = { endX: actPoint.endX, endY: actPoint.endY, startX: (actPoint.endX - (width ? width : 0)),
                        startY: actPoint.startY };
                    break;
                default:
                    actPoint = { endX: actPoint.endX, endY: actPoint.endY, startX: (actPoint.endX - (width ? width : 0)),
                        startY: actPoint.endY - (height ? height : 0) };
                    break;
                }
                break;
            case 270:
                switch (flip) {
                case 'horizontal':
                    actPoint.startX = actPoint.endX - height;
                    actPoint = { startX: actPoint.startX, startY: actPoint.endY - (width ? width : 0), endX: actPoint.endX,
                        endY: actPoint.endY};
                    break;
                case 'vertical':
                    actPoint = { startX: actPoint.startX, startY: actPoint.startY, endX: (actPoint.startX + height),
                        endY: actPoint.startY + (width ? width : 0) };
                    break;
                default:
                    actPoint.endX = actPoint.startX + height;
                    actPoint = { startX: actPoint.startX, startY: actPoint.endY - (width ? width : 0), endX: actPoint.endX,
                        endY: actPoint.endY};
                    break;
                }
                break;
            }
        }
        if (parent.activeObj.flipObjColl.length === 0) {
            switch (degree) {
            case 0:
                actPoint = { startX: actPoint.startX, startY: actPoint.startY, endX: (actPoint.startX + (width ? width : 0)),
                    endY: actPoint.startY + (height ? height : 0) };
                break;
            case 90:
                actPoint.startX = actPoint.endX - height;
                actPoint = { startX: actPoint.startX, startY: actPoint.startY, endX: (actPoint.endX),
                    endY: actPoint.startY + (width ? width : 0) };
                break;
            case 180:
                actPoint = { endX: actPoint.endX, endY: actPoint.endY, startX: (actPoint.endX - (width ? width : 0)),
                    startY: actPoint.endY - (height ? height : 0) };
                break;
            case 270:
                actPoint.endX = actPoint.startX + height;
                actPoint = { startX: actPoint.startX, startY: actPoint.endY - (width ? width : 0), endX: actPoint.endX,
                    endY: actPoint.endY};
                break;
            }
        }
        actPoint.width = actPoint.endX - actPoint.startX;
        actPoint.height = actPoint.endY - actPoint.startY;
        parent.activeObj.activePoint = actPoint;
        if (parent.transform.degree === 360 || parent.transform.degree === -360) {parent.transform.degree = 0; }
    }

    private setActivePoint(startX?: number, startY?: number): void {
        const parent: ImageEditor = this.parent;
        let activePoint: ActivePoint = parent.activeObj.activePoint;
        if (isNullOrUndefined(activePoint)) {
            return;
        }
        if (parent.currObjType.isText) {
            const textWidth: number = startX ? startX : 0;
            const textHeight: number = startY ? startY : parent.activeObj.textSettings.fontSize;
            if (parent.activeObj.textSettings.fontSize === undefined) {
                parent.activeObj.textSettings.fontSize = (Math.abs(parent.baseImgCanvas.width - parent.baseImgCanvas.height)) * 0.1;
            }
            this.setTextSelection(textWidth, textHeight);
            this.mouseDownPoint.x = activePoint.endX; this.mouseDownPoint.y = activePoint.endY;
            if (parent.activeObj.horTopLine !== undefined) {
                parent.activeObj.activePoint = extend({}, activePoint, {}, true) as ActivePoint;
            }
            parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate'}});
        } else if (startX && startY) {
            activePoint.startX = this.mouseDownPoint.x = startX;
            activePoint.startY = this.mouseDownPoint.y = startY;
            parent.currObjType.isDragging = true;
        } else {
            const selectInfo: SelectionPoint = parent.activeObj;
            activePoint = { startX: selectInfo.horTopLine.startX, startY: selectInfo.horTopLine.startY,
                endX: selectInfo.horTopLine.endX, endY: selectInfo.horTopLine.endY };
            activePoint.width = activePoint.endX - activePoint.startX;
            activePoint.height = activePoint.endY - activePoint.startY;
        }
    }

    private mouseDownEventHandler(e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent;
        this.mouseDown = e.currentTarget === parent.lowerCanvas || e.currentTarget === parent.upperCanvas ?
            'canvas' : '';
        if (e.type === 'touchstart') {
            this.isTouch = true;
        } else {
            this.isTouch = false;
        }
        if (e.type === 'touchstart' && e.currentTarget === parent.lowerCanvas && !parent.isImageLoaded) {
            return;
        }
        this.isCropSelection = false; this.isPan = true; let splitWords: string[];
        if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
        if (splitWords !== undefined && splitWords[0] === 'crop'){
            this.isCropSelection = true;
        }
        if (this.isCropSelection) {
            this.dragCanvas = parent.togglePan = true;
        }
        const imageEditorClickEventArgs: ImageEditorClickEventArgs = {point: this.setXYPoints(e)};
        if (isBlazor() && parent.events && parent.events.clicked.hasDelegate === true) {
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            (parent.dotNetRef.invokeMethodAsync('ClickEventAsync', 'click', imageEditorClickEventArgs) as any).then((imageEditorClickEventArgs: ImageEditorClickEventArgs) => {
                this.clickEvent(imageEditorClickEventArgs, e);
            });
        } else {
            parent.trigger('click', imageEditorClickEventArgs);
            this.clickEvent(imageEditorClickEventArgs, e);
        }
    }

    private getImagePoints(x: number, y: number): Point {
        const parent: ImageEditor = this.parent;
        const { destLeft, destTop, destWidth, destHeight } = parent.img;
        if (x < destLeft) {
            x = destLeft;
        }
        else if (x > destLeft + destWidth) {
            x = destLeft + destWidth;
        }
        if (y < destTop) {
            y = destTop;
        }
        else if (y > destTop + destHeight) {
            y = destTop + destHeight;
        }
        return {x: x, y: y};
    }

    private clickEvent(imageEditorClickEventArgs: ImageEditorClickEventArgs, e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent;
        const activePoint: ActivePoint = parent.activeObj.activePoint;
        const x: number = imageEditorClickEventArgs.point.x; const y: number = imageEditorClickEventArgs.point.y;
        const cursor: string = parent.activeObj.shape && parent.activeObj.shape === 'text' ?
            parent.cursor : 'default';
        if (parent.isResize) {
            this.performEnterAction();
            parent.upperCanvas.style.cursor = 'default';
            return;
        } else if (JSON.stringify(parent.frameObj) !== JSON.stringify(parent.tempFrameObj)) {
            parent.okBtn();
        } else if (this.currentDrawingShape !== '') {
            const object: Object = {currObj: {} as CurrentObject };
            parent.notify('filter', { prop: 'getCurrentObj', onPropertyChange: false, value: {object: object }});
            this.initialPrevObj = object['currObj'];
            this.initialPrevObj.objColl = extend([], parent.objColl, [], true) as SelectionPoint[];
            this.initialPrevObj.pointColl = extend([], parent.pointColl, [], true) as Point[];
            this.initialPrevObj.afterCropActions = extend([], parent.afterCropActions, [], true) as string[];
            const selPointCollObj: Object = {selPointColl: null };
            parent.notify('freehand-draw', { prop: 'getSelPointColl', onPropertyChange: false,
                value: {obj: selPointCollObj }});
            this.initialPrevObj.selPointColl = extend([], selPointCollObj['selPointColl'], [], true) as Point[];
            this.setActivePoint(x, y);
            if (this.currentDrawingShape === 'path') {
                const point: Point = this.getImagePoints(x, y);
                parent.activeObj.pointColl.push({x: point.x, y: point.y });
                if (activePoint.width !== 0 && activePoint.height !== 0) {
                    activePoint.width = 0; activePoint.height = 0;
                    activePoint.startX = parent.activeObj.pointColl[parent.activeObj.pointColl.length - 1].x;
                    activePoint.startY = parent.activeObj.pointColl[parent.activeObj.pointColl.length - 1].y;
                }
            }
            activePoint.endX = activePoint.startX;
            activePoint.endY = activePoint.startY;
            parent.currObjType.isDragging = true;
            const previousShapeSettings: ShapeSettings = this.updatePrevShapeSettings();
            const shapeResizingArgs: ShapeChangeEventArgs = {cancel: false, action: 'draw-start',  previousShapeSettings: previousShapeSettings};
            const shapeMovingArgs: ShapeChangeEventArgs = {cancel: false, action: 'move', previousShapeSettings: previousShapeSettings};
            this.shapeResizingArgs = shapeResizingArgs; this.shapeMovingArgs = shapeMovingArgs;
            this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'mouse-down');
            return;
        }
        parent.notify('draw', { prop: 'resetFrameZoom', onPropertyChange: false, value: {isOk: true }});
        if (this.isCropSelection && this.dragCanvas) {
            this.setCursor(x, y);
            if (parent.cursor !== 'move' && parent.cursor !== 'crosshair' &&
                parent.cursor !== 'default' && parent.cursor !== 'grab') {
                this.isPan = false;
            }
        }
        if (parent.activeObj.shape) {
            this.isObjSelected = true;
        } else {
            this.isObjSelected = false;
        }
        const object: Object = {currObj: {} as CurrentObject };
        parent.notify('filter', { prop: 'getCurrentObj', onPropertyChange: false, value: {object: object }});
        const prevObj: CurrentObject = object['currObj'];
        const activeObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        const isShape: boolean = this.isShapeTouch(e, this.isCropSelection);
        const isFreehandDraw: boolean = this.isFreehandDrawTouch(e, this.isCropSelection);
        const isShapeClick: boolean = isShape ? isShape : this.isShapeClick(e, this.isCropSelection);
        const allowUndoRedoPush: boolean = this.applyCurrShape(isShapeClick);
        const isTextArea: boolean = parent.textArea.style.display !== 'none'? true : false;
        if (this.isTouch && !isShape && activeObj.shape && !this.isCropSelection) {
            if (this.applyObj(x, y)) {
                parent.okBtn(true);
                parent.notify('draw', { prop: 'setPrevActObj', onPropertyChange: false, value: { prevActObj: null }});
            }
            const prevCropObj: CurrentObject = extend({}, parent.cropObj, {}, true) as CurrentObject;
            parent.notify('undo-redo', { prop: 'updateUndoRedoColl', onPropertyChange: false,
                value: {operation: 'shapeTransform', previousObj: prevObj, previousObjColl: prevObj.objColl,
                    previousPointColl: prevObj.pointColl, previousSelPointColl: prevObj.selPointColl,
                    previousCropObj: prevCropObj, previousText: null,
                    currentText: null, previousFilter: null, isCircleCrop: parent.isCircleCrop}});
            if (allowUndoRedoPush) {
                parent.notify('undo-redo', {prop: 'updateCurrUrc', value: {type: 'ok' }});
            }
        }
        if (!isShape && !parent.togglePen && !this.isCropSelection) {
            if (!isBlazor()) {
                parent.notify('toolbar', { prop: 'refresh-main-toolbar', onPropertyChange: false});
                parent.notify('toolbar', { prop: 'close-contextual-toolbar', onPropertyChange: false});
            } else if (parent.isImageLoaded) {
                parent.updateToolbar(parent.element, 'imageLoaded', 'okBtnClick');
            }
        }
        if (this.dragCanvas && this.isPan && (parent.cursor === 'grab' || this.isTouch)
            && !isShape && !isFreehandDraw && !parent.togglePen) {
            if (this.applyObj(x, y)) {
                parent.okBtn(true);
                if (allowUndoRedoPush) {
                    const cursor: string = parent.cursor;
                    parent.notify('undo-redo', {prop: 'updateCurrUrc', value: {type: 'ok' }});
                    parent.cursor = cursor;
                }
                parent.notify('draw', { prop: 'setPrevActObj', onPropertyChange: false, value: { prevActObj: null }});
            }
            if (this.isFhdEditing) {
                parent.notify('freehand-draw', {prop: 'applyFhd', onPropertyChange: false});
                this.isFhdCustomized = false;
                if (!isBlazor()) {
                    parent.notify('toolbar', { prop: 'destroy-qa-toolbar', onPropertyChange: false});
                }
            }
            const shape: string = parent.activeObj.shape;
            const shapeColl: string[] = ['rectangle', 'ellipse', 'line', 'arrow', 'path', 'text', 'image'];
            if (shape && shapeColl.indexOf(shape) > -1) {
                parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                    value: {x: null, y: null, isMouseDown: null}});
                parent.notify('shape', { prop: 'refreshActiveObj', onPropertyChange: false});
                if (!isBlazor()) {
                    parent.notify('toolbar', {prop: 'setCurrentToolbar', value: {type: 'main' }});
                    parent.notify('toolbar', { prop: 'refresh-main-toolbar', onPropertyChange: false});
                } else {
                    parent.updateToolbar(parent.element, 'imageLoaded');
                }
            }
            this.canvasMouseDownHandler(e);
        }
        else {
            let isLineArrow: boolean = false;
            if (parent.activeObj.shape && (parent.activeObj.shape === 'line' ||
                parent.activeObj.shape === 'arrow')) {
                isLineArrow = true;
            }
            const points: Point = this.setXYPoints(e);
            const x: number = points.x; const y: number = points.y;
            if (this.applyObj(x, y)) {
                parent.okBtn(true);
                if (allowUndoRedoPush) {
                    const cursor: string = parent.cursor;
                    parent.notify('undo-redo', {prop: 'updateCurrUrc', value: {type: 'ok' }});
                    parent.cursor = cursor;
                }
                parent.notify('draw', { prop: 'setPrevActObj', onPropertyChange: false, value: { prevActObj: null }});
            }
            parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                value: {x: x, y: y, isMouseDown: true}});
            const obj: Object = {index: null };
            parent.notify('freehand-draw', {prop: 'getFreehandDrawHoveredIndex', onPropertyChange: false, value: {obj: obj }});
            const indexObj: Object = {freehandSelectedIndex: null };
            parent.notify('freehand-draw', {prop: 'getFreehandSelectedIndex', onPropertyChange: false, value: {obj: indexObj }});
            if (this.isFhdPoint || (this.isFhdCustomized && !parent.togglePen)) {
                if (!isNullOrUndefined(indexObj['freehandSelectedIndex']) &&
                indexObj['freehandSelectedIndex'] !== obj['index']) {
                    const tempHoveredIndex: number = obj['index'];
                    parent.okBtn();
                    this.isFhdCustomized = false;
                    parent.notify('freehand-draw', { prop: 'setFreehandDrawHoveredIndex', onPropertyChange: false,
                        value: {index: tempHoveredIndex }});
                    if (obj['index'] > -1) {
                        const strokeColor: string = parent.pointColl[obj['index']].strokeColor;
                        parent.notify('freehand-draw', { prop: 'hoverFhd', onPropertyChange: false,
                            value: {strokeColor: strokeColor, strokeWidth: parent.pointColl[obj['index']].strokeWidth}});
                    }
                }
                indexObj['freehandSelectedIndex'] = null;
                parent.notify('freehand-draw', {prop: 'getFreehandSelectedIndex', onPropertyChange: false, value: {obj: indexObj }});
                const objColl: SelectionPoint[] = extend([], parent.objColl, [], true) as SelectionPoint[];
                if (!isNullOrUndefined(obj['index']) && obj['index'] > -1) {
                    parent.notify('freehand-draw', {prop: 'selectFhd', value: {type: 'ok' }});
                    parent.notify('freehand-draw', { prop: 'hoverFhd', onPropertyChange: false,
                        value: { strokeColor: null, strokeWidth: null } });
                    if (!isBlazor()) {
                        parent.notify('toolbar', { prop: 'renderQAT', onPropertyChange: false, value: {isPenEdit: true} });
                    } else {
                        parent.updateToolbar(parent.element, 'pen');
                        parent.updateToolbar(parent.element, 'quickAccessToolbar', 'pen');
                    }
                } else if (indexObj['freehandSelectedIndex']) {
                    parent.okBtn();
                    const strokeColor: string = parent.pointColl[indexObj['freehandSelectedIndex']].strokeColor;
                    parent.notify('freehand-draw', { prop: 'hoverFhd', onPropertyChange: false,
                        value: {strokeColor: strokeColor, strokeWidth: parent.pointColl[indexObj['freehandSelectedIndex']].strokeWidth}});
                } else if (this.findTargetObj(x, y, false)) {
                    parent.objColl = objColl;
                    this.findTarget(x, y, e.type);
                    parent.notify('draw', { prop: 'redrawDownScale' });
                }
            } else {
                if (this.isFhdEditing) {
                    parent.notify('freehand-draw', {prop: 'cancelFhd', value: {type: 'ok' }});
                    const qbArea: HTMLElement = document.getElementById(parent.element.id + '_quickAccessToolbarArea');
                    if (qbArea) {
                        qbArea.style.display = 'none';
                    }
                }
                if (!isBlazor()) {
                    const isPenDraw: boolean = parent.togglePen;
                    parent.notify('toolbar', { prop: 'close-contextual-toolbar', onPropertyChange: false});
                    if (isPenDraw) {parent.freehandDraw(true); }
                }
                this.isFhdEditing = false;
                if (isLineArrow) {
                    this.setCursor(x, y);
                } else if (cursor !== 'default') {
                    parent.upperCanvas.style.cursor = parent.cursor = cursor;
                }
                if (parent.cursor === 'crosshair' || (Browser.isDevice && parent.togglePen)) {
                    if (parent.togglePen) {
                        if (isNullOrUndefined(parent.activeObj.strokeSettings)) {
                            const obj: Object = {strokeSettings: {} as StrokeSettings };
                            parent.notify('shape', { prop: 'getStrokeSettings', onPropertyChange: false, value: {obj: obj }});
                            parent.activeObj.strokeSettings = obj['strokeSettings'];
                        }
                        const obj: Object = {penStrokeWidth: null };
                        parent.notify('freehand-draw', {prop: 'getPenStrokeWidth', onPropertyChange: false, value: {obj: obj }});
                        if (isNullOrUndefined(obj['penStrokeWidth'])) {
                            parent.notify('freehand-draw', {prop: 'setPenStrokeWidth', onPropertyChange: false, value: {value: 2 }});
                        }
                        this.upperContext.strokeStyle = parent.activeObj.strokeSettings.strokeColor;
                        this.upperContext.fillStyle = parent.activeObj.strokeSettings.strokeColor;
                        parent.notify('freehand-draw', { prop: 'freehandDownHandler', onPropertyChange: false,
                            value: {e: e, canvas: parent.upperCanvas} });
                    } else {
                        parent.notify('shape', { prop: 'refreshActiveObj', onPropertyChange: false});
                        this.upperContext.clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
                    }
                    parent.currObjType.isActiveObj = false; this.dragElement = '';
                    this.dragPoint.startX = this.dragPoint.startY = this.dragPoint.endX = this.dragPoint.endY = 0;
                }
                if ((parent.cursor !== 'crosshair' && e.type.toLowerCase() === 'touchstart') ||
                    (parent.currObjType.isActiveObj && parent.cursor !== 'default' && !parent.togglePen)) {
                    this.findTarget(x, y, e.type);
                    parent.notify('draw', { prop: 'redrawDownScale' });
                }
                else if ((parent.currObjType.shape === '' || parent.currObjType.isCustomCrop) && !parent.togglePen  && parent.cursor !== 'default') {
                    this.setActivePoint(x, y);
                }
                if (isTextArea) {
                    parent.notify('draw', { prop: 'clearOuterCanvas', onPropertyChange: false, value: {context: this.lowerContext}});
                }
            }
        }
        this.isShapeInserted = false;
        this.tempActiveObj = extend({}, parent.activeObj, {}, true) as SelectionPoint;
    }

    private mouseMoveEventHandler(e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent;
        const cursor: string = parent.cursor;
        const canvasCursor: string = parent.upperCanvas.style.cursor;
        e.preventDefault();
        if (this.timer && this.timer > 0) {this.timer = 0; }
        const bbox: DOMRect = parent.lowerCanvas.getBoundingClientRect() as DOMRect;
        if (e.type === 'touchmove' && e.touches.length === 2) {
            if (this.isFirstMove) {
                this.startTouches = this.targetTouches(e.touches);
                this.tempTouches = [];
                this.tempTouches.push({x: (e.touches[0].clientX || (e.touches[0].pageX - parent.lowerCanvas.offsetLeft) - bbox.left),
                    y: (e.touches[0].clientY || (e.touches[0].pageY - parent.lowerCanvas.offsetTop)) - bbox.top});
                this.tempTouches.push({x: (e.touches[1].clientX || (e.touches[1].pageX - parent.lowerCanvas.offsetLeft)) - bbox.left,
                    y: (e.touches[1].clientY || (e.touches[1].pageY - parent.lowerCanvas.offsetTop)) - bbox.top});
            } else {
                const firstFingerX: number = (e.touches[0].clientX || (e.touches[0].pageX - parent.lowerCanvas.offsetLeft)) - bbox.left;
                const firstFingerY: number = (e.touches[0].clientY || (e.touches[0].pageY - parent.lowerCanvas.offsetTop)) - bbox.top;
                const secondFingerX: number = (e.touches[1].clientX || (e.touches[1].pageX - parent.lowerCanvas.offsetLeft)) - bbox.left;
                const secondFingerY: number = (e.touches[1].clientY || (e.touches[1].pageY - parent.lowerCanvas.offsetTop)) - bbox.top;
                const center: Point = {x: firstFingerX < secondFingerX ? secondFingerX - ((secondFingerX - firstFingerX) / 2) :
                    firstFingerX - ((firstFingerX - secondFingerX) / 2), y: firstFingerY < secondFingerY ?
                    secondFingerY - ((secondFingerY - firstFingerY) / 2) : firstFingerY - ((firstFingerY - secondFingerY) / 2)};
                if (this.currMousePoint.x !== center.x && this.currMousePoint.y !== center.y) {
                    let type: string = '';
                    if (e.type === 'touchmove' && (parent.zoomSettings.zoomTrigger & ZoomTrigger.Pinch) === ZoomTrigger.Pinch) {
                        this.zoomType = 'Pinch';
                        const scale: number = this.calculateScale(this.startTouches,
                                                                  this.targetTouches((e as MouseEvent & TouchEvent).touches));
                        this.startTouches = this.targetTouches((e as MouseEvent & TouchEvent).touches);
                        if (scale > 1) {
                            type = 'zoomIn';
                        } else if (scale < 1) {
                            type = 'zoomOut';
                        }
                    }
                    if (type !== '') {
                        parent.notify('draw', { prop: 'performPointZoom', onPropertyChange: false,
                            value: {x: center.x, y: center.y, type: type, isResize: null }});
                    }
                    this.tempTouches = [];
                    this.tempTouches.push({x: e.touches[0].clientX || (e.touches[0].pageX - parent.lowerCanvas.offsetLeft),
                        y: e.touches[0].clientY || (e.touches[0].pageY - parent.lowerCanvas.offsetTop)});
                    this.tempTouches.push({x: e.touches[1].clientX || (e.touches[1].pageX - parent.lowerCanvas.offsetLeft),
                        y: e.touches[1].clientY || (e.touches[1].pageY - parent.lowerCanvas.offsetTop)});
                    this.currMousePoint.x = center.x; this.currMousePoint.y = center.y;
                    this.isPinching = true;
                }
            }
            this.isFirstMove = false;
            return;
        }
        let x: number; let y: number;
        if (e.type === 'mousemove') {
            x = e.clientX; y = e.clientY;
        } else {
            this.touchEndPoint.x = x = e.touches[0].clientX;
            this.touchEndPoint.y = y = e.touches[0].clientY;
        }
        x -= bbox.left; y -= bbox.top;
        this.canvasMouseMoveHandler(e);
        let isCropSelection: boolean = false; let splitWords: string[];
        if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
        if (splitWords !== undefined && splitWords[0] === 'crop'){
            isCropSelection = true;
        }
        if (isCropSelection) {
            parent.notify('transform', { prop: 'disableZoomOutBtn', value: {isZoomOut: true }});
        }
        parent.upperCanvas.style.cursor = canvasCursor; parent.cursor = cursor;
        if (parent.currObjType.isActiveObj && (parent.activeObj.activePoint !== undefined || parent.objColl.length > 0) &&
            !this.dragCanvas || parent.activeObj.activePoint !== undefined) {
            if (this.dragElement === '') {
                this.setCursor(x, y);
                if ((parent.activeObj.activePoint &&
                    (parent.activeObj.activePoint.width === 0 || (!isNullOrUndefined(parent.activeObj.currIndex) &&
                    this.cursorTargetId !== parent.activeObj.currIndex)))
                    && parent.cursor !== 'default' &&
                    parent.cursor !== 'move' && parent.cursor !== 'crosshair'
                    && parent.cursor !== 'grab' && parent.cursor !== 'pointer') {
                    parent.upperCanvas.style.cursor = parent.cursor = 'move';
                }
                this.findTarget(x, y, e.type);
            }
        }
        const { destLeft, destTop, destWidth, destHeight } = parent.img;
        if (parent.currObjType.isDragging) {
            this.upperContext.clearRect(0, 0, parent.lowerCanvas.width, parent.lowerCanvas.height);
            this.updateActivePoint(x, y, isCropSelection);
            parent.notify('shape', { prop: 'updateTrianglePoints', onPropertyChange: false, value: {obj: parent.activeObj}});
            if (this.isPreventDragging) {
                if ((parent.activeObj.activePoint.startX > destLeft) &&
                    (parent.activeObj.activePoint.endX < destLeft + destWidth) &&
                    (parent.activeObj.activePoint.startY > destTop)
                    && (parent.activeObj.activePoint.endY < destTop + destHeight)) {
                    this.isPreventDragging = false;
                }
                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: null, isCropRatio: null,
                    points: null, isPreventDrag: true, saveContext: null, isPreventSelection: null } });
            } else {
                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: null, isCropRatio: null,
                    points: null, isPreventDrag: null, saveContext: null, isPreventSelection: null }});
            }
            if (isCropSelection) {
                this.dragCanvas = parent.togglePan = true;
            }
        }
    }

    private mouseUpEventHandler(e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent; const id: string = parent.element.id;
        if (!Browser.isDevice && ((parent.element.querySelector('#' + id + '_contextualToolbar') &&
            !parent.element.querySelector('#' + id + '_contextualToolbar').parentElement.classList.contains('e-hide')) ||
            (parent.element.querySelector('#' + id + '_headWrapper')
            && !parent.element.querySelector('#' + id + '_headWrapper').parentElement.classList.contains('e-hide')))) {
            return;
        } else if (e.currentTarget === document && this.mouseDown === '') {
            e.stopImmediatePropagation();
            return;
        }
        if (e.type === 'touchstart') {
            this.isTouch = false;
        } else if (e.type === 'touchend') {
            e.stopImmediatePropagation();
        }
        e.preventDefault();
        if (parent.togglePan) {this.canvasMouseUpHandler(e); }
        let x: number; let y: number;
        if (e.type === 'mouseup') {
            x = e.clientX; y = e.clientY;
        } else {
            x = this.touchEndPoint.x; y = this.touchEndPoint.y;
        }
        const bbox: DOMRect = parent.lowerCanvas.getBoundingClientRect() as DOMRect;
        x -= bbox.left; y -= bbox.top;
        if (e.type === 'touchend') {
            this.startTouches = this.tempTouches = [];
            this.isFirstMove = false;
            if (parent.textArea.style.display === 'none') {
                this.timer = 0;
            }
            if (this.isPinching) {
                this.isPinching = false;
                parent.notify('draw', { prop: 'redrawDownScale' });
                if (parent.isCropTab || parent.activeObj.shape) {
                    parent.notify('draw', { prop: 'setStraightenActObj', value: {activeObj: null }});
                    parent.notify('freehand-draw', { prop: 'resetStraightenPoint' });
                }
                if (parent.isStraightening) {
                    parent.notify('draw', { prop: 'resetStraightenDestPoints' });
                    parent.notify('draw', { prop: 'setDestForStraighten' });
                }
                return;
            }
        }
        let isCropSelection: boolean = false; let splitWords: string[];
        if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
        if (splitWords !== undefined && splitWords[0] === 'crop') {
            isCropSelection = true;
        }
        if (isBlazor() && parent.eventType) {
            if (parent.eventType === 'pan') {
                if (parent.events && parent.events.onPanEnd.hasDelegate === true) {
                    parent.dotNetRef.invokeMethodAsync('PanEventAsync', 'OnPanEnd', parent.panEventArgs);
                }
            }
            else if (parent.eventType === 'resize') {
                if (!this.isCropSelection && parent.events && parent.events.onShapeResizeEnd.hasDelegate === true) {
                    this.shapeResizingArgs.currentShapeSettings = this.updatePrevShapeSettings();
                    this.shapeResizingArgs.action = this.currentDrawingShape !== '' ? 'drawing' : 'resize-end';
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    (parent.dotNetRef.invokeMethodAsync('ShapeEventAsync', 'OnShapeResizeEnd', this.shapeResizingArgs, null) as any).then((shapeResizingArgs: ShapeChangeEventArgs) => {
                        parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                            value: {shapeSettings: shapeResizingArgs.currentShapeSettings}});
                    });
                } else if (this.shapeResizingArgs && this.selectionResizingArgs && parent.events &&
                    parent.events.onSelectionResizeEnd.hasDelegate === true) {
                    const currentSelectionSettings: CropSelectionSettings = {type: parent.activeObj.shape,
                        startX: this.shapeResizingArgs.currentShapeSettings.startX,
                        startY: this.shapeResizingArgs.currentShapeSettings.startY,
                        width: this.shapeResizingArgs.currentShapeSettings.width,
                        height: this.shapeResizingArgs.currentShapeSettings.height};
                    this.selectionResizingArgs.currentSelectionSettings = currentSelectionSettings;
                    this.selectionResizingArgs.action = 'resize-end';
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    (parent.dotNetRef.invokeMethodAsync('SelectionEventAsync', 'OnSelectionResizeEnd', this.selectionResizingArgs) as any).then((selectionResizingArgs: SelectionChangeEventArgs) => {
                        parent.notify('shape', { prop: 'updateSelectionChangeEventArgs', onPropertyChange: false,
                            value: {selectionSettings: selectionResizingArgs.currentSelectionSettings}});
                    });
                }
            } else {
                if (this.shapeMovingArgs && parent.events && parent.events.onShapeDragEnd.hasDelegate === true) {
                    this.shapeMovingArgs.currentShapeSettings = this.updatePrevShapeSettings();
                    this.shapeMovingArgs.action = 'drag-end';
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    (parent.dotNetRef.invokeMethodAsync('ShapeEventAsync', 'OnShapeDragEnd', this.shapeMovingArgs, null) as any).then((shapeMovingArgs: ShapeChangeEventArgs) => {
                        parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
                            value: {shapeSettings: shapeMovingArgs.currentShapeSettings}});
                    });
                }
            }
            this.shapeResizingArgs = null; this.shapeMovingArgs = null;
            parent.panEventArgs = null; parent.eventType = null;
        }
        if (this.currentDrawingShape === 'path') {
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            const elem: any = e.srcElement;
            const elemId: string = elem.parentElement.id; const id: string = parent.element.id;
            if (e.currentTarget !== parent.upperCanvas && e.currentTarget !== parent.lowerCanvas && parent.activeObj.pointColl.length > 0 &&
                (elem.classList.contains('e-upload-icon') || elemId === id + '_zoomIn' ||
                elemId === id + '_zoomOut' || elemId === id + '_annotationBtn' ||
                elemId === id + '_borderColorBtn' || elemId === id + '_borderWidthBtn' || elemId === id + '_saveBtn')) {
                parent.notify('shape', { prop: 'stopPathDrawing', onPropertyChange: false, value: {e: e, isApply: true }});
                this.upperContext.clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: parent.activeObj, isCropRatio: null,
                    points: null, isPreventDrag: true, saveContext: null, isPreventSelection: true} });
            }
            return;
        }
        if (e.currentTarget === parent.upperCanvas && !parent.isResize) {
            this.pathAdjustedIndex = null;
            if (this.currentDrawingShape !== '') {
                if (this.currentDrawingShape === 'text') {
                    const prevCropObj: CurrentObject = extend({}, parent.cropObj, {}, true) as CurrentObject;
                    parent.notify('undo-redo', { prop: 'updateUndoRedoColl', onPropertyChange: false,
                        value: {operation: 'shapeInsert', previousObj: this.initialPrevObj, previousObjColl: this.initialPrevObj.objColl,
                            previousPointColl: this.initialPrevObj.pointColl, previousSelPointColl: this.initialPrevObj.selPointColl,
                            previousCropObj: prevCropObj, previousText: null,
                            currentText: null, previousFilter: null, isCircleCrop: null }});
                } else {
                    parent.notify('undo-redo', { prop: 'updateUrObj', onPropertyChange: false, value: {objColl: this.initialPrevObj.objColl, operation: 'shapeInsert'}});
                }
                this.isShapeInserted = true; this.currentDrawingShape = '';
                if (parent.activeObj.activePoint.width === 0 && parent.activeObj.activePoint.height === 0) {
                    parent.notify('draw', {prop: 'performCancel', value: {isContextualToolbar: null }});
                }
                const previousShapeSettings: ShapeSettings = this.updatePrevShapeSettings();
                const shapeResizingArgs: ShapeChangeEventArgs = {cancel: false, action: 'draw-end',  previousShapeSettings: previousShapeSettings};
                const shapeMovingArgs: ShapeChangeEventArgs = {cancel: false, action: 'move', previousShapeSettings: previousShapeSettings};
                this.shapeResizingArgs = shapeResizingArgs; this.shapeMovingArgs = shapeMovingArgs;
                this.triggerShapeChange(shapeResizingArgs, shapeMovingArgs, 'mouse-up');
            }
            this.adjustActObjForLineArrow(); this.updPtCollForShpRot();
            parent.currObjType.shape = parent.currObjType.shape.toLowerCase();
            const prevCropObj: CurrentObject = extend({}, parent.cropObj, {}, true) as CurrentObject;
            const object: Object = {currObj: {} as CurrentObject };
            parent.notify('filter', { prop: 'getCurrentObj', onPropertyChange: false, value: {object: object }});
            const prevObj: CurrentObject = object['currObj'];
            prevObj.objColl = extend([], parent.objColl, [], true) as SelectionPoint[];
            prevObj.pointColl = extend([], parent.pointColl, [], true) as Point[];
            prevObj.afterCropActions = extend([], parent.afterCropActions, [], true) as string[];
            const selPointCollObj: Object = {selPointColl: null };
            parent.notify('freehand-draw', { prop: 'getSelPointColl', onPropertyChange: false,
                value: {obj: selPointCollObj }});
            prevObj.selPointColl = extend([], selPointCollObj['selPointColl'], [], true) as Point[];
            if (!parent.togglePen && !isCropSelection) {
                if (this.tempObjColl && parent.activeObj.activePoint.width !== 0) {
                    parent.notify('shape', { prop: 'updImgRatioForActObj', onPropertyChange: false});
                    parent.objColl.push(parent.activeObj);
                    if (JSON.stringify(parent.activeObj.activePoint) !== JSON.stringify(this.tempActiveObj.activePoint)) {
                        parent.notify('undo-redo', { prop: 'updateUndoRedoColl', onPropertyChange: false,
                            value: {operation: 'shapeTransform', previousObj: prevObj, previousObjColl: this.tempObjColl,
                                previousPointColl: prevObj.pointColl, previousSelPointColl: prevObj.selPointColl,
                                previousCropObj: prevCropObj, previousText: null,
                                currentText: null, previousFilter: null, isCircleCrop: null}});
                    }
                    this.redrawShape(parent.objColl[parent.objColl.length - 1], true);
                    this.tempObjColl = undefined;
                }
                if (!this.isFhdEditing) {
                    this.applyCurrActObj(x, y);
                    parent.currObjType.isResize = false;
                    if (!isBlazor()) {parent.notify('toolbar', { prop: 'destroy-qa-toolbar', onPropertyChange: false}); }
                }
            }
            if (parent.activeObj) {
                let isCropSelection: boolean = false;
                let splitWords: string[];
                if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
                if (splitWords === undefined && (parent.currObjType.isCustomCrop || parent.togglePen)) {
                    isCropSelection = true;
                } else if (splitWords !== undefined && splitWords[0] === 'crop'){
                    isCropSelection = true;
                }
                const shape: string = parent.activeObj.shape;
                if (!isBlazor()) {
                    const shapeColl: string[] = ['rectangle', 'ellipse', 'line', 'arrow', 'path'];
                    if (shapeColl.indexOf(shape) > -1) {
                        parent.notify('toolbar', { prop: 'refresh-toolbar', onPropertyChange: false, value: {type: 'shapes',
                            isApplyBtn: null, isCropping: null, isZooming: null, cType: null}});
                    } else if (shape === 'text') {
                        if (parent.textArea.style.display === 'none') {
                            parent.notify('toolbar', { prop: 'refresh-toolbar', onPropertyChange: false, value: {type: 'text',
                                isApplyBtn: null, isCropping: null, isZooming: null, cType: null}});
                        }
                    } else if (this.isFhdEditing) {
                        parent.notify('toolbar', { prop: 'refresh-toolbar', onPropertyChange: false, value: {type: 'pen',
                            isApplyBtn: null, isCropping: null, isZooming: null, cType: null}});
                    } else if (!isCropSelection) {
                        const eventargs: object = { type: 'main', isApplyBtn: null, isCropping: false, isZooming: null };
                        parent.notify('toolbar', { prop: 'refresh-toolbar', onPropertyChange: false, value: eventargs});
                    }
                    parent.notify('toolbar', { prop: 'update-toolbar-items', onPropertyChange: false});
                } else {
                    const shapeColl: string[] = ['rectangle', 'ellipse', 'line', 'arrow', 'path', 'image'];
                    if (shapeColl.indexOf(shape) > -1) {
                        parent.updateToolbar(parent.element, parent.activeObj.shape);
                    } else if (parent.activeObj.shape === 'text' && parent.textArea.style.display === 'none') {
                        parent.updateToolbar(parent.element, 'text');
                    }
                }
            }
        }
        if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
        if (splitWords !== undefined && splitWords[0] === 'crop'){
            isCropSelection = true;
        }
        if (parent.activeObj.shape && !isCropSelection && e.currentTarget === parent.upperCanvas &&
            parent.textArea.style.display === 'none') {
            if (parent.activeObj.shape === 'text') {
                if (!isBlazor()) {
                    parent.notify('toolbar', { prop: 'refresh-toolbar', onPropertyChange: false, value: {type: 'text',
                        isApplyBtn: null, isCropping: null, isZooming: null, cType: null}});
                }
            } else {
                if (!isBlazor()) {
                    parent.notify('toolbar', { prop: 'refresh-toolbar', onPropertyChange: false, value: {type: 'shapes',
                        isApplyBtn: null, isCropping: null, isZooming: null, cType: null}});
                }
            }
            if (!isBlazor()) {
                parent.notify('toolbar', { prop: 'update-toolbar-items', onPropertyChange: false});
                parent.notify('toolbar', { prop: 'renderQAT', onPropertyChange: false, value: {isPenEdit: null} });
            } else {
                parent.updateToolbar(parent.element, 'quickAccessToolbar', parent.activeObj.shape);
            }
        }
        if (parent.togglePen && e.currentTarget === parent.upperCanvas) {
            parent.notify('freehand-draw', { prop: 'freehandUpHandler', onPropertyChange: false,
                value: {e: e, canvas: parent.upperCanvas, context: this.upperContext} });
        } else {parent.currObjType.shape = ''; }
        this.dragElement = ''; this.mouseDown = '';
        parent.currObjType.isInitialLine = parent.currObjType.isDragging = false;
        this.selMouseUpEvent();
    }

    private adjustActObjForLineArrow(obj?: SelectionPoint): boolean {
        let isAdjusted: boolean = false;  const parent: ImageEditor = this.parent;
        obj = obj ? obj : parent.activeObj;
        if (obj.shape && (obj.shape === 'line' || parent.activeObj.shape === 'arrow')) {
            let temp: number;
            if ((this.dragElement === 'e-resize' && obj.activePoint.endX < obj.activePoint.startX) ||
                (this.dragElement === 'w-resize' && obj.activePoint.startX > obj.activePoint.endX)) {
                isAdjusted = true;
                temp = obj.activePoint.startX;
                obj.activePoint.startX = obj.activePoint.endX;
                obj.activePoint.endX = temp;
                temp = obj.activePoint.startY;
                obj.activePoint.startY = obj.activePoint.endY;
                obj.activePoint.endY = temp;
            }
            obj.activePoint.width = Math.abs(obj.activePoint.endX - obj.activePoint.startX);
            obj.activePoint.height = Math.abs(obj.activePoint.endY - obj.activePoint.startY);
            if (parent.activeObj.shape !== 'path') {
                parent.notify('shape', { prop: 'setPointCollForLineArrow', onPropertyChange: false,
                    value: {obj: obj }});
                for (let i: number = 0; i < obj.pointColl.length; i++) {
                    obj.pointColl[i as number].ratioX = (obj.pointColl[i as number].x -
                        parent.img.destLeft) / parent.img.destWidth;
                    obj.pointColl[i as number].ratioY = (obj.pointColl[i as number].y -
                        parent.img.destTop) / parent.img.destHeight;
                }
            }
        }
        return isAdjusted;
    }

    private updPtCollForShpRot(obj?: SelectionPoint): void {
        const parent: ImageEditor = this.parent;
        obj = obj ? obj : parent.activeObj;
        if (obj.shape && obj.rotatedAngle !== 0) {
            parent.notify('shape', { prop: 'setPointCollForShapeRotation', onPropertyChange: false, value: {obj: obj }});
            const {destLeft, destTop, destWidth, destHeight} = parent.img;
            const { horTopLinePointColl, horBottomLinePointColl, verLeftLinePointColl, verRightLinePointColl } = obj;
            const setRatio = (point: Point) => {
                point.ratioX = (point.x - destLeft) / destWidth;
                point.ratioY = (point.y - destTop) / destHeight;
            };
            horTopLinePointColl.forEach(setRatio);
            horBottomLinePointColl.forEach(setRatio);
            verLeftLinePointColl.forEach(setRatio);
            verRightLinePointColl.forEach(setRatio);
        }
    }

    private setXYPoints(e: MouseEvent & TouchEvent): Point {
        e.preventDefault();
        let x: number; let y: number;
        if (e.type === 'mousedown') {
            x = e.clientX; y = e.clientY;
        } else {
            this.touchEndPoint.x = x = e.touches[0].clientX;
            this.touchEndPoint.y = y = e.touches[0].clientY;
        }
        const bbox: DOMRect = this.parent.lowerCanvas.getBoundingClientRect() as DOMRect;
        x -= bbox.left; y -= bbox.top;
        return {x: x, y: y};
    }

    private getCurrentIndex(): number {
        let index: number; const parent: ImageEditor = this.parent;
        for (let i: number = 0, len: number = parent.objColl.length; i < len; i++) {
            if (parent.activeObj.currIndex === parent.objColl[i as number].currIndex) {
                index = i;
                break;
            }
        }
        return index;
    }

    private isShapeClick(e: MouseEvent & TouchEvent, isCropSelection: boolean): boolean {
        const parent: ImageEditor = this.parent;
        let isShape: boolean = false;
        if (parent.togglePen) {
            return isShape;
        }
        if (parent.activeObj.shape && parent.activeObj.shape === 'text' && this.isShapeInserted) {
            const isTextArea: boolean = (parent.textArea.style.display === 'block' || parent.textArea.style.display === 'inline-block')
                ? true : false;
            const activeObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
            parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                value: { x: null, y: null, isMouseDown: true } });
            const points: Point = this.setXYPoints(e);
            const x: number = points.x; const y: number = points.y;
            isShape = this.findTargetObj(x, y, isCropSelection);
            if (!isCropSelection) {
                this.upperContext.clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
                if (isShape) {
                    parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                        value: { x: null, y: null, isMouseDown: true } });
                }
            }
            if (isTextArea) {
                parent.textArea.value = parent.objColl[parent.objColl.length - 1].keyHistory;
                parent.textArea.style.display = 'block';
                parent.activeObj = activeObj;
                const index: number = this.getCurrentIndex();
                if (isNullOrUndefined(index)) {
                    parent.objColl.pop();
                } else {
                    parent.objColl.splice(index, 1);
                }
            } else if (!isShape && activeObj.shape) {
                parent.activeObj = activeObj;
                const index: number = this.getCurrentIndex();
                if ((!isNullOrUndefined(index) &&
                    JSON.stringify(parent.activeObj.activePoint) === JSON.stringify(parent.objColl[index as number].activePoint))) {
                    parent.objColl.splice(index, 1);
                } else if (isNullOrUndefined(parent.activeObj.currIndex)) {
                    parent.objColl.pop();
                }
            }
        }
        return isShape;
    }

    private isShapeTouch(e: MouseEvent & TouchEvent, isCropSelection: boolean): boolean {
        const parent: ImageEditor = this.parent;
        let isShape: boolean = false;
        if (e.type === 'touchstart' && !parent.togglePen) {
            if (parent.activeObj && parent.activeObj.shape === 'text') {
                this.timer = setTimeout(this.setTimer.bind(this), 1000, e);
            }
            const isTextArea: boolean = (parent.textArea.style.display === 'block' || parent.textArea.style.display === 'inline-block')
                ? true : false;
            const activeObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
            parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                value: { x: null, y: null, isMouseDown: true } });
            const points: Point = this.setXYPoints(e);
            const x: number = points.x; const y: number = points.y;
            isShape = this.findTargetObj(x, y, isCropSelection);
            if (!isCropSelection) {
                this.upperContext.clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
            }
            if (isTextArea) {
                parent.textArea.value = parent.objColl[parent.objColl.length - 1].keyHistory;
                parent.textArea.style.display = 'block';
                parent.activeObj = activeObj;
                const index: number = this.getCurrentIndex();
                if (isNullOrUndefined(index)) {
                    parent.objColl.pop();
                } else {
                    parent.objColl.splice(index, 1);
                }
            } else if (!isShape && activeObj.shape) {
                parent.activeObj = activeObj;
                const index: number = this.getCurrentIndex();
                if (!isCropSelection) {
                    if ((!isNullOrUndefined(index) && JSON.stringify(parent.activeObj.activePoint) ===
                    JSON.stringify(parent.objColl[index as number].activePoint))) {
                        parent.objColl.splice(index, 1);
                    } else if (isNullOrUndefined(parent.activeObj.currIndex)) {
                        parent.objColl.pop();
                    }
                }
            }
        }
        return isShape;
    }

    private isFreehandDrawTouch(e: MouseEvent & TouchEvent, isCropSelection: boolean): boolean {
        const parent: ImageEditor = this.parent;
        let isFreehandDraw: boolean = false;
        if (e.type === 'touchstart' && !isCropSelection && !parent.togglePen) {
            const isTextArea: boolean = (parent.textArea.style.display === 'block' || parent.textArea.style.display === 'inline-block')
                ? true : false;
            const activeObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
            parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                value: {x: null, y: null, isMouseDown: true}});
            const points: Point = this.setXYPoints(e);
            const x: number = points.x; const y: number = points.y;
            this.setCursor(x, y);
            if (this.isFhdPoint) {
                isFreehandDraw = true;
            }
            if (isTextArea) {
                parent.textArea.value = parent.objColl[parent.objColl.length - 1].keyHistory;
                parent.textArea.style.display = 'block';
                parent.activeObj = activeObj;
                const index: number = this.getCurrentIndex();
                if (isNullOrUndefined(index)) {
                    parent.objColl.pop();
                } else {
                    parent.objColl.splice(index, 1);
                }
            } else if (activeObj.shape) {
                parent.activeObj = activeObj;
                const index: number = this.getCurrentIndex();
                if (!isCropSelection) {
                    if ((!isNullOrUndefined(index) && JSON.stringify(parent.activeObj.activePoint) ===
                    JSON.stringify(parent.objColl[index as number].activePoint))) {
                        parent.objColl.splice(index, 1);
                    } else if (isNullOrUndefined(parent.activeObj.currIndex)) {
                        parent.objColl.pop();
                    }
                }
            }
        }
        return isFreehandDraw;
    }

    private applyObj(x: number, y:  number): boolean {
        const parent: ImageEditor = this.parent;
        let isApply: boolean = false;
        const shapeColl: string[] = ['rectangle', 'ellipse', 'line', 'arrow', 'path', 'image', 'text'];
        const {startX, startY, endX, endY} = parent.activeObj.activePoint;
        if (parent.activeObj.shape && shapeColl.indexOf(parent.activeObj.shape) > -1) {
            const radius: number = parent.activeObj.topLeftCircle.radius;
            if (x >= (startX - (radius * 2)) && x <= (endX + (radius * 2)) && y >= (startY - (radius * 2)) &&
                        y <= (endY + (radius * 2))) {
                isApply = false;
            } else if (parent.upperCanvas.style.cursor !== 'default' && parent.upperCanvas.style.cursor !== 'grab' &&
                parent.upperCanvas.style.cursor !== 'crosshair' && parent.upperCanvas.style.cursor !== 'pointer' &&
                parent.upperCanvas.style.cursor !== 'move') {
                isApply = false;
            } else {
                isApply = true;
            }
        }
        return isApply;
    }

    private applyCurrShape(isShapeClick: boolean): boolean {
        const parent: ImageEditor = this.parent;
        let isApply: boolean = false;
        if (parent.togglePen) {
            return isApply;
        }
        let obj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        if (this.isShapeInserted && parent.activeObj.shape === 'text' && isShapeClick) {
            this.isInitialTextEdited = true;
            parent.notify('draw', { prop: 'setShapeTextInsert', onPropertyChange: false, value: {bool: true } });
        }
        if (parent.textArea.style.display === 'block' || parent.textArea.style.display === 'inline-block') {
            const activeObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
            parent.notify('shape', { prop: 'redrawActObj', onPropertyChange: false,
                value: { x: null, y: null, isMouseDown: null } });
            obj = extend({}, parent.objColl[parent.objColl.length - 1], null, true) as SelectionPoint;
            parent.objColl.pop();
            parent.activeObj = extend({}, activeObj, null, true) as SelectionPoint;
            parent.textArea.value = obj.keyHistory;
            parent.textArea.style.display = 'block';
            let strokeColor: string = obj.strokeSettings && obj.strokeSettings.strokeColor ? obj.strokeSettings.strokeColor.split('(')[0] === 'rgb' ?
                this.rgbToHex(parseFloat(obj.strokeSettings.strokeColor.split('(')[1].split(',')[0]),
                              parseFloat(obj.strokeSettings.strokeColor.split('(')[1].split(',')[1]),
                              parseFloat(obj.strokeSettings.strokeColor.split('(')[1].split(',')[2]),
                              parseFloat(obj.strokeSettings.strokeColor.split('(')[1].split(',')[3])) :
                obj.strokeSettings.strokeColor : null;
            if (strokeColor && strokeColor === '#ffffff') {
                strokeColor = '#fff';
            }
            if (this.tempActiveObj.strokeSettings && this.tempActiveObj.strokeSettings.strokeColor &&
                this.tempActiveObj.strokeSettings.strokeColor === '#ffffff') {
                this.tempActiveObj.strokeSettings.strokeColor = '#fff';
            }
            if (obj.keyHistory !== this.tempActiveObj.keyHistory ||
                (strokeColor && (strokeColor !== this.tempActiveObj.strokeSettings.strokeColor)) ||
                (obj.textSettings && obj.textSettings.fontFamily !== this.tempActiveObj.textSettings.fontFamily) ||
                (obj.textSettings && Math.round(obj.textSettings.fontSize) !== Math.round(this.tempActiveObj.textSettings.fontSize)) ||
                (obj.textSettings && Math.round(obj.textSettings.fontRatio) !== Math.round(this.tempActiveObj.textSettings.fontRatio)) ||
                (obj.textSettings && obj.textSettings.bold !== this.tempActiveObj.textSettings.bold) ||
                (obj.textSettings && obj.textSettings.italic !== this.tempActiveObj.textSettings.italic) ||
                (obj.textSettings && obj.textSettings.underline !== this.tempActiveObj.textSettings.underline)) {
                isApply = true;
            }
            if (this.isInitialTextEdited && !isApply) {
                isApply = true;
                this.isInitialTextEdited = false;
            }
        } else {
            this.tempActiveObj.activePoint.height = Math.abs(this.tempActiveObj.activePoint.height);
            isApply = JSON.stringify(obj) !== JSON.stringify(this.tempActiveObj);
        }
        return isApply;
    }

    private canvasMouseDownHandler(e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent;
        e.preventDefault();
        let x: number; let y: number;
        if (e.type === 'mousedown') {
            x = e.offsetX || (e.pageX - parent.lowerCanvas.offsetLeft);
            y = e.offsetY || (e.pageY - parent.lowerCanvas.offsetTop);
        } else {
            x = e.touches[0].clientX || (e.touches[0].pageX - parent.lowerCanvas.offsetLeft);
            y = e.touches[0].clientY || (e.touches[0].pageY - parent.lowerCanvas.offsetTop);
        }
        const bbox: DOMRect = parent.lowerCanvas.getBoundingClientRect() as DOMRect;
        x -= bbox.left; y -= bbox.top;
        this.panDown = {x: x, y: y};
        const tempPanMoveObj: Object = {tempPanMove: null };
        parent.notify('transform', { prop: 'getTempPanMove', onPropertyChange: false,
            value: {obj: tempPanMoveObj }});
        if (isNullOrUndefined(tempPanMoveObj['tempPanMove'])) {
            parent.notify('transform', { prop: 'setTempPanMove', onPropertyChange: false,
                value: {point: {x: x, y: y} }});
        }
    }

    private canvasMouseMoveHandler(e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent;
        const frameObject: Object = {bool: null };
        parent.notify('toolbar', { prop: 'getFrameToolbar', onPropertyChange: false, value: {obj: frameObject }});
        if (parent.isResize || frameObject['bool']) {parent.upperCanvas.style.cursor = 'default'; return; }
        if (this.dragCanvas) {parent.lowerCanvas.style.cursor = 'grab'; }
        else {this.dragCanvas = parent.togglePan = false;
            parent.lowerCanvas.style.cursor = parent.upperCanvas.style.cursor = parent.cursor = 'default'; }
        let x: number; let y: number;
        if (e.type === 'mousemove') {
            x = e.offsetX;
            y = e.offsetY;
        } else {
            x = e.touches[0].clientX || (e.touches[0].pageX - parent.lowerCanvas.offsetLeft);
            y = e.touches[0].clientY || (e.touches[0].pageY - parent.lowerCanvas.offsetTop);
        }
        const bbox: DOMRect = parent.lowerCanvas.getBoundingClientRect() as DOMRect;
        x -= bbox.left; y -= bbox.top;
        const panMove: Point = {x: x, y: y};
        parent.notify('transform', { prop: 'setPanMove', onPropertyChange: false,
            value: {point: {x: x, y: y} }});
        if (this.panDown && panMove && parent.togglePan && this.dragCanvas) {
            if (parent.isCropTab || parent.activeObj.shape) {
                parent.notify('draw', { prop: 'setStraightenActObj', value: {activeObj: null }});
                parent.notify('freehand-draw', { prop: 'resetStraightenPoint' });
            }
            parent.notify('transform', { prop: 'drawPannedImage', onPropertyChange: false,
                value: {xDiff: null, yDiff: null}});
        }
    }

    private canvasMouseUpHandler(e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent;
        e.preventDefault();
        const panMoveObj: Object = {panMove: null };
        parent.notify('transform', { prop: 'getPanMove', onPropertyChange: false,
            value: {obj: panMoveObj }});
        if (parent.togglePan) {
            if (this.panDown && panMoveObj['panMove'] && parent.togglePan && this.dragCanvas) {
                this.panDown = null;
                parent.notify('transform', { prop: 'setPanMove', onPropertyChange: false,
                    value: {point: null }});
                parent.notify('transform', { prop: 'setTempPanMove', onPropertyChange: false,
                    value: {point: null }});
            }
        }
        if (this.currentDrawingShape !== 'path') {
            parent.currObjType.isDragging = false;
        }
    }

    private touchStartHandler(e: MouseEvent & TouchEvent): void {
        e.preventDefault(); const parent: ImageEditor = this.parent;
        if (this.touchTime === 0) {
            this.touchTime = new Date().getTime();
        } else {
            if (((new Date().getTime()) - this.touchTime) < 400) {
                parent.notify('shape', { prop: 'stopPathDrawing', onPropertyChange: false, value: {e: e, isApply: null }});
                this.touchTime = 0;
            } else {
                this.touchTime = new Date().getTime();
            }
        }
        if (e.touches.length === 2) {
            this.isFirstMove = true;
        } else {
            this.mouseDownEventHandler(e);
        }
        EventHandler.add(parent.lowerCanvas, 'touchend', this.mouseUpEventHandler, this);
        EventHandler.add(parent.lowerCanvas, 'touchmove', this.mouseMoveEventHandler, this);
        EventHandler.add(parent.upperCanvas, 'touchend', this.mouseUpEventHandler, this);
        EventHandler.add(parent.upperCanvas, 'touchmove', this.mouseMoveEventHandler, this);
    }

    private unwireEvent(): void {
        const parent: ImageEditor = this.parent;
        EventHandler.remove(parent.lowerCanvas, 'touchend', this.mouseUpEventHandler);
        EventHandler.remove(parent.lowerCanvas, 'touchmove', this.mouseMoveEventHandler);
        EventHandler.remove(parent.upperCanvas, 'touchend', this.mouseUpEventHandler);
        EventHandler.remove(parent.upperCanvas, 'touchmove', this.mouseMoveEventHandler);
    }

    private keyDownEventHandler(e: KeyboardEvent): void {
        const parent: ImageEditor = this.parent;
        if (e.ctrlKey && (e.key === '+' || e.key === '-')) {
            e.preventDefault();
        }
        const obj: Object = { fileName: '', fileType: null };
        parent.notify('draw', { prop: 'getFileName', onPropertyChange: false, value: {obj: obj }});
        const beforeSave: BeforeSaveEventArgs = {fileName: obj['fileName'], fileType: obj['fileType'], cancel: false};
        switch (e.key) {
        case (e.ctrlKey && 's'):
            if (isBlazor() && parent.events && parent.events.saving.hasDelegate === true) {
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                (parent.dotNetRef.invokeMethodAsync('BeforeSaveEventAsync', 'BeforeSave', beforeSave) as any).then((args: BeforeSaveEventArgs) => {
                    this.beforeSaveEvent(args, e);
                });
            } else {
                parent.trigger('beforeSave', beforeSave);
                this.beforeSaveEvent(beforeSave, e);
            }
            break;
        case (e.ctrlKey && 'z'):
            if (parent.allowUndoRedo) {
                parent.notify('undo-redo', {prop: 'call-undo'});
            }
            break;
        case (e.ctrlKey && 'y'):
            if (parent.allowUndoRedo) {
                parent.notify('undo-redo', {prop: 'call-redo'});
            }
            break;
        case (e.ctrlKey && '+'):
            if ((parent.zoomSettings.zoomTrigger & ZoomTrigger.Commands) === ZoomTrigger.Commands) {
                this.zoomType = 'Commands';
                parent.notify('transform', { prop: 'zoomAction', onPropertyChange: false,
                    value: {zoomFactor: .1, zoomPoint: null}, isResize: null});
                parent.notify('draw', { prop: 'redrawDownScale' });
                if (parent.isCropTab || parent.activeObj.shape) {
                    parent.notify('draw', { prop: 'setStraightenActObj', value: {activeObj: null }});
                    parent.notify('freehand-draw', { prop: 'resetStraightenPoint' });
                }
                if (parent.isStraightening) {
                    parent.notify('draw', { prop: 'resetStraightenDestPoints' });
                    parent.notify('draw', { prop: 'setDestForStraighten' });
                }
            }
            break;
        case (e.ctrlKey && '-'):
            if ((parent.zoomSettings.zoomTrigger & ZoomTrigger.Commands) === ZoomTrigger.Commands) {
                this.zoomType = 'Commands';
                parent.notify('transform', { prop: 'zoomAction', onPropertyChange: false,
                    value: {zoomFactor: -.1, zoomPoint: null}, isResize: null});
                parent.notify('draw', { prop: 'redrawDownScale' });
                if (parent.isCropTab || parent.activeObj.shape) {
                    parent.notify('draw', { prop: 'setStraightenActObj', value: {activeObj: null }});
                    parent.notify('freehand-draw', { prop: 'resetStraightenPoint' });
                }
                if (parent.isStraightening) {
                    parent.notify('draw', { prop: 'resetStraightenDestPoints' });
                    parent.notify('draw', { prop: 'setDestForStraighten' });
                }
            }
            break;
        case 'Delete':
            this.deleteItem();
            break;
        case 'Escape':
            parent.notify('draw', {prop: 'performCancel', value: {isContextualToolbar: null}});
            break;
        case 'Enter':
            this.performEnterAction(e);
            break;
        case 'Tab':
            this.performTabAction();
            break;
        default:
            if (Browser.isDevice && (parent.textArea.style.display === 'block' || parent.textArea.style.display === 'inline-block')) {
                setTimeout(this.textKeyDown.bind(this), 1, e);
            }
            break;
        }
    }

    private performEnterAction(e?: KeyboardEvent): void {
        const parent: ImageEditor = this.parent;
        if (parent.isResize) {
            const isValue: boolean = this.isValueUpdated();
            if (!isValue) {return; }
            const point: Point = this.getNumTextValue();
            const aspectRatioElement: HTMLInputElement = (parent.element.querySelector('#' + parent.element.id + '_aspectratio') as HTMLInputElement);
            const blrAspRatElem: HTMLInputElement = (parent.element.querySelector('.e-ie-toolbar-aspect-ratio-btn') as HTMLInputElement);
            if (point && point.x && point.y) {
                if (aspectRatioElement || (blrAspRatElem && !blrAspRatElem.classList.contains('e-hidden'))) {
                    parent.notify('transform', {prop: 'resize', value: {width: point.x, height: null, isAspectRatio: true }});
                }
                else {
                    parent.notify('transform', {prop: 'resize', value: {width: point.x, height: point.y, isAspectRatio: false }});
                }
            }
            if (isBlazor()) {
                const aspectRatioHeight: HTMLInputElement = this.parent.element.querySelector('.e-ie-toolbar-e-resize-height-input .e-textbox');
                const aspectRatioWidth: HTMLInputElement = this.parent.element.querySelector('.e-ie-toolbar-e-resize-width-input .e-textbox');
                if ((blrAspRatElem && blrAspRatElem.classList.contains('e-hidden'))) {
                    if (aspectRatioHeight && aspectRatioHeight.value === "") {
                        aspectRatioHeight.value = aspectRatioHeight.placeholder;
                        (aspectRatioHeight as HTMLInputElement).value = aspectRatioHeight.placeholder;
                    }
                    if (aspectRatioWidth && aspectRatioWidth.value === "") {
                        aspectRatioWidth.value = aspectRatioWidth.placeholder;
                        (aspectRatioWidth as HTMLInputElement).value = aspectRatioWidth.placeholder;
                    }
                }
            } else {
                const aspectRatioHeight: HTMLElement = parent.element.querySelector('#' + parent.element.id + '_resizeHeight');
                const aspectRatioWidth: HTMLElement = parent.element.querySelector('#' + parent.element.id + '_resizeWidth');
                if (isNullOrUndefined(aspectRatioElement)) {
                    if (aspectRatioHeight) {
                        const elem: NumericTextBox = getComponent(aspectRatioHeight, 'numerictextbox') as NumericTextBox;
                        if (aspectRatioHeight && (aspectRatioHeight as HTMLInputElement).value === '') {
                            elem.value = parseFloat(elem.placeholder);
                            (aspectRatioHeight as HTMLInputElement).value = elem.placeholder + 'px';
                        }
                    }
                    if (aspectRatioWidth) {
                        const elem: NumericTextBox = getComponent(aspectRatioWidth, 'numerictextbox') as NumericTextBox;
                        if (aspectRatioWidth && (aspectRatioWidth as HTMLInputElement).value === '') {
                            elem.value = parseFloat(elem.placeholder);
                            (aspectRatioWidth as HTMLInputElement).value = elem.placeholder + 'px';
                        }
                    }
                }
            }
            parent.notify('draw', { prop: 'redrawDownScale' });
        } else {
            let splitWords: string[];
            if (parent.activeObj.shape) {splitWords = parent.activeObj.shape.split('-'); }
            if (e && this.isKeyBoardCrop(e) &&
                parent.activeObj.horTopLine && (parent.activeObj.shape && splitWords[0] === 'crop')) {
                parent.crop();
            }
        }
    }

    private isKeyBoardCrop(e: KeyboardEvent): boolean {
        let bool: boolean = false;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const target: any = e.target;
        if ((target.id === this.parent.element.id + '_ok' || target.id === '') && !isBlazor()) {
            bool = true;
        }
        return bool;
    }

    private beforeSaveEvent(observableSaveArgs: BeforeSaveEventArgs, e: KeyboardEvent): void {
        const parent: ImageEditor = this.parent;
        if (!observableSaveArgs.cancel) {
            parent.notify('export', { prop: 'export', onPropertyChange: false,
                value: {type: observableSaveArgs.fileType, fileName: observableSaveArgs.fileName}});
        }
        e.preventDefault();
        e.stopImmediatePropagation();
    }

    private handleScroll(e: KeyboardEvent): void {
        const parent: ImageEditor = this.parent;
        let x: number; let y: number; let isInsideCanvas: boolean = false;
        if (e.type === 'mousewheel') {
            // eslint-disable-next-line
            x = (e as any).clientX; y = (e as any).clientY;
        }
        const bbox: DOMRect = parent.lowerCanvas.getBoundingClientRect() as DOMRect;
        x -= bbox.left; y -= bbox.top;
        if (x > parent.img.destLeft && x < parent.img.destLeft + parent.img.destWidth && y > parent.img.destTop &&
            y < parent.img.destTop + parent.img.destHeight) {
            isInsideCanvas = true;
        }
        e.stopPropagation();
        if (e.ctrlKey === true && isInsideCanvas) {
            e.preventDefault();
            if (!parent.isCropTab && (parent.activeObj.shape && parent.activeObj.shape.split('-')[0] !== 'crop')) {
                parent.okBtn();
                if (!isBlazor()) {
                    parent.notify('toolbar', { prop: 'close-contextual-toolbar', onPropertyChange: false});
                }
            }
            let type: string = '';
            if (e.type === 'mousewheel' && (parent.zoomSettings.zoomTrigger & ZoomTrigger.MouseWheel) === ZoomTrigger.MouseWheel) {
                this.zoomType = 'MouseWheel';
                // eslint-disable-next-line
                if ((e as any).wheelDelta > 0) {
                    type = 'zoomIn';
                } else {
                    type = 'zoomOut';
                }
            }
            if (type !== '') {
                parent.notify('draw', { prop: 'performPointZoom', onPropertyChange: false,
                    value: {x: x, y: y, type: type, isResize: null }});
                parent.notify('draw', { prop: 'redrawDownScale' });
                if (parent.isCropTab || parent.activeObj.shape) {
                    parent.notify('draw', { prop: 'setStraightenActObj', value: {activeObj: null }});
                    parent.notify('freehand-draw', { prop: 'resetStraightenPoint' });
                }
                if (parent.isStraightening) {
                    parent.notify('draw', { prop: 'resetStraightenDestPoints' });
                    parent.notify('draw', { prop: 'setDestForStraighten' });
                }
            }
        }
    }

    private textKeyDown(e: KeyboardEvent): void {
        const parent: ImageEditor = this.parent;
        if (parent.activeObj.rotatedAngle !== 0) {
            return;
        }
        if (String.fromCharCode(e.which) === '\r') {
            this.textRow += 1;
        }
        parent.textArea.setAttribute('rows', this.textRow.toString());
        parent.textArea.style.height = 'auto';
        parent.textArea.style.height = parent.textArea.scrollHeight + 'px';
        parent.notify('shape', { prop: 'setTextBoxWidth', onPropertyChange: false, value: { e: e }});
        if (Browser.isDevice) {
            parent.textArea.style.width = parseFloat(parent.textArea.style.width) + parent.textArea.style.fontSize + 'px';
        }
        const rows: string[] = parent.textArea.value.split('\n');
        this.textRow = rows.length;
        parent.textArea.setAttribute('rows', this.textRow.toString());
        this.isInitialTextEdited = false;
    }

    private clearSelection(): void {
        const parent: ImageEditor = this.parent;
        if (!parent.disabled && parent.isImageLoaded) {
            parent.togglePen = false;
            parent.notify('shape', { prop: 'refreshActiveObj', onPropertyChange: false});
            this.dragElement = '';
            this.dragPoint.startX = this.dragPoint.startY = this.dragPoint.endX = this.dragPoint.endY = 0;
            parent.currObjType.shape = '';
            this.upperContext.clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
            parent.currObjType.isActiveObj = true; parent.currObjType.isCustomCrop = false;
            parent.upperCanvas.style.cursor = parent.cursor = 'default';
        }
    }

    private setDragDirection(width: number, height: number): void {
        const arcRadius: number = (7.5); const parent: ImageEditor = this.parent;
        const actPoint: ActivePoint = parent.activeObj.activePoint;
        if (parent.img.destWidth > parent.img.destHeight) {
            actPoint.startX = this.dragPoint.startX = ((width / 2) - (height / 2)) + arcRadius;
            actPoint.startY = this.dragPoint.startY = ((height / 2) - (height / 2)) + arcRadius;
            actPoint.endX = ((width / 2) + (height / 2)) - arcRadius;
            actPoint.endY = ((height / 2) + (height / 2)) - arcRadius;
        }
        else {
            actPoint.startY = this.dragPoint.startX = ((height / 2) - (width) / 2) + arcRadius;
            actPoint.endY = ((height / 2) + (width) / 2) - arcRadius;
            actPoint.startX = this.dragPoint.startX = arcRadius;
            actPoint.endX = width - arcRadius;
        }
    }

    private calcShapeRatio(x: number, y: number, imgWidth: number, imgHeight: number): void {
        const parent: ImageEditor = this.parent; const actPoint: ActivePoint = parent.activeObj.activePoint;
        const arcRadius: number = (7.5); const presetRatio: number = x / y;
        const originalWidth: number = imgWidth; const originalHeight: number = imgHeight;
        const standardSize: number = originalWidth >= originalHeight ? originalWidth : originalHeight;
        let width: number = standardSize * presetRatio; let height: number = standardSize;
        const scaleWidth: number = this.getScale(width, originalWidth); const snippetArray: number[] = [];
        const { destLeft, destTop, destWidth, destHeight } = parent.img;
        for (let i: number = 0; i < 2; i++) {
            if (i === 0) { snippetArray.push(width * scaleWidth); }
            else { snippetArray.push(height * scaleWidth); }
        }
        width = snippetArray[0]; height = snippetArray[1];
        const scaleHeight: number = this.getScale(height, originalHeight);
        const snippetArray1: number[] = [];
        for (let i: number = 0; i < 2; i++) {
            if (i === 0) { snippetArray1.push(width * scaleHeight); }
            else { snippetArray1.push(height * scaleHeight); }
        }
        width = snippetArray1[0]; height = snippetArray1[1];
        actPoint.width = width;
        actPoint.height = height;
        actPoint.startX = (this.dragPoint.startX = (originalWidth - width) / 2) + arcRadius;
        actPoint.startY = (this.dragPoint.startY = (originalHeight - height) / 2) + arcRadius;
        actPoint.endX = actPoint.startX + actPoint.width;
        actPoint.endY = actPoint.startY + actPoint.height;
        if (actPoint.startX < destLeft && destLeft + destWidth > parent.lowerCanvas.clientWidth) {
            actPoint.startX = destLeft;
            actPoint.endX = actPoint.startX + width - arcRadius;
        }
        if (actPoint.startY < destTop && destTop + destHeight > parent.lowerCanvas.clientHeight) {
            actPoint.startY = destTop;
            actPoint.endY = actPoint.startY + height - arcRadius;
        }
        actPoint.width = actPoint.endX - actPoint.startX;
        actPoint.height = actPoint.endY - actPoint.startY;
    }

    private getScale(value: number, originalValue: number): number {
        return value > originalValue ? originalValue / value : 1;
    }


    private findTarget(x: number, y: number, type: string): void {
        const parent: ImageEditor = this.parent;
        if (type.toLowerCase() === 'mousedown' || type.toLowerCase() === 'touchstart') {
            let splitWords: string[]; let isCrop: boolean = false;
            if (parent.activeObj.shape) {
                splitWords = parent.activeObj.shape.split('-');
                if (splitWords[0] === 'crop') {isCrop = true; }
            }
            this.findTargetObj(x, y, isCrop);
            this.updateCursorStyles(x, y, type);
        } else {
            const { topLeftCircle, topCenterCircle, topRightCircle, centerLeftCircle, centerRightCircle,
                bottomLeftCircle, bottomCenterCircle, bottomRightCircle } = parent.activeObj;
            switch ( this.dragElement.toLowerCase()) {
            case 'nw-resize':
                topLeftCircle.startX = x; topLeftCircle.startY = y;
                break;
            case 'n-resize':
                topCenterCircle.startX = x; topCenterCircle.startY = y;
                break;
            case 'ne-resize':
                topRightCircle.startX = x; topRightCircle.startY = y;
                break;
            case 'w-resize':
                centerLeftCircle.startX = x; centerLeftCircle.startY = y;
                break;
            case 'e-resize':
                centerRightCircle.startX = x; centerRightCircle.startY = y;
                break;
            case 'sw-resize':
                bottomLeftCircle.startX = x; bottomLeftCircle.startY = y;
                break;
            case 's-resize':
                bottomCenterCircle.startX = x; bottomCenterCircle.startY = y;
                break;
            case 'se-resize':
                bottomRightCircle.startX = x; bottomRightCircle.startY = y;
                break;
            default:
                if (this.dragPoint.startX && this.dragPoint.startY) {
                    this.previousPoint.x = this.dragPoint.endX; this.previousPoint.y = this.dragPoint.endY;
                    this.dragPoint.endX = x; this.dragPoint.endY = y;
                }
                break;
            }
        }
    }

    private findTargetObj(x: number, y: number, isCrop: boolean): boolean {
        const parent: ImageEditor = this.parent;
        let isShape: boolean = false;
        if (parent.objColl.length !== 0 && !parent.currObjType.isCustomCrop && !isCrop) {
            let diffX: number = 0; let i: number;
            for (let index: number = 0; index < parent.objColl.length; index++ ) {
                const cursor: string = parent.upperCanvas.style.cursor;
                this.setCursor(x, y);
                const actObj: SelectionPoint = extend({}, parent.objColl[index as number], {}, true) as SelectionPoint;
                const radius: number = actObj.topLeftCircle.radius;
                if (actObj.shape === 'line' || actObj.shape === 'arrow') {
                    for (let j: number = 0; j < actObj.pointColl.length; j++) {
                        if (x >= actObj.pointColl[j as number].x - (radius * 2) &&
                            x <= actObj.pointColl[j as number].x + (radius * 2) &&
                            y >= actObj.pointColl[j as number].y - (radius * 2) &&
                            y <= actObj.pointColl[j as number].y + (radius * 2)) {
                            if (this.tempActiveObj && this.tempActiveObj.activePoint &&
                                JSON.stringify(this.tempActiveObj.activePoint) === JSON.stringify(actObj.activePoint)) {
                                i = index;
                                break;
                            } else {
                                if (this.isTouch || parent.cursor === 'move' ||
                                    parent.cursor === 'grab' || this.isShapeInserted) {
                                    if (diffX === 0 || diffX > x - actObj.activePoint.startX) {
                                        diffX = x - parent.objColl[index as number].activePoint.startX;
                                        i = index;
                                    }
                                } else if (parent.objColl[index as number].currIndex === this.tempActiveObj.currIndex) {
                                    i = index;
                                }
                            }
                            break;
                        }
                    }
                } else if (actObj.shape === 'path') {
                    const cursor: string = this.setCursorForPath(actObj, x, y, parent.upperCanvas);
                    if (cursor !== 'default' && cursor !== 'grab') {
                        if (this.tempActiveObj && this.tempActiveObj.activePoint &&
                            JSON.stringify(this.tempActiveObj.activePoint) === JSON.stringify(actObj.activePoint)) {
                            i = index;
                            break;
                        } else {
                            if (this.isTouch || parent.cursor === 'move' || parent.cursor === 'grab' || this.isShapeInserted) {
                                if (diffX === 0 || diffX > x - actObj.activePoint.startX) {
                                    diffX = x - parent.objColl[index as number].activePoint.startX;
                                    i = index;
                                }
                            } else if (parent.objColl[index as number].currIndex === this.tempActiveObj.currIndex) {
                                i = index;
                            }
                        }
                    }
                } else if (actObj.rotatedAngle !== 0) {
                    const cursor: string = this.setCursorForRotatedObject(actObj, x, y, parent.upperCanvas);
                    if (cursor !== 'default' && cursor !== 'grab') {
                        if (this.tempActiveObj && this.tempActiveObj.activePoint &&
                            JSON.stringify(this.tempActiveObj.activePoint) === JSON.stringify(actObj.activePoint)) {
                            i = index;
                            break;
                        } else {
                            if (this.isTouch || parent.cursor === 'move' || parent.cursor === 'grab' || this.isShapeInserted) {
                                if (diffX === 0 || diffX > x - actObj.activePoint.startX) {
                                    diffX = x - parent.objColl[index as number].activePoint.startX;
                                    i = index;
                                }
                            } else if (parent.objColl[index as number].currIndex === this.tempActiveObj.currIndex) {
                                i = index;
                            }
                        }
                    }
                } else {
                    const rotationCirclePoint: Point = this.getTransRotationPoint(actObj);
                    if ((x >= (actObj.activePoint.startX - (radius * 2)) &&
                        x <= (actObj.activePoint.endX + (radius * 2)) &&
                        y >= (actObj.activePoint.startY - (radius * 2)) &&
                        y <= (actObj.activePoint.endY + (radius * 2))) ||
                        (rotationCirclePoint &&
                        x >= (rotationCirclePoint.x - (radius * 2)) &&
                        x <= (rotationCirclePoint.x + (radius * 2)) &&
                        y >= (rotationCirclePoint.y - (radius * 2)) &&
                        y <= (rotationCirclePoint.y + (radius * 2)))) {
                        if (this.tempActiveObj && this.tempActiveObj.activePoint &&
                            JSON.stringify(this.tempActiveObj.activePoint) === JSON.stringify(actObj.activePoint)) {
                            i = index;
                            break;
                        } else {
                            if (this.isTouch || cursor === 'move' || cursor === 'grabbing' || this.isShapeInserted
                                || parent.cursor === 'move' || parent.cursor === 'grabbing') {
                                if (diffX === 0 || diffX > x - actObj.activePoint.startX) {
                                    diffX = x - parent.objColl[index as number].activePoint.startX;
                                    i = index;
                                }
                            } else if (parent.objColl[index as number].currIndex === this.tempActiveObj.currIndex) {
                                i = index;
                            }
                        }
                    }
                }
            }
            if (isNullOrUndefined(i)) {
                parent.notify('shape', { prop: 'refreshActiveObj', onPropertyChange: false});
                isShape = false;
            } else {
                this.tempObjColl = extend([], parent.objColl, [], true) as SelectionPoint[];
                parent.currObjType.isCustomCrop = false;
                parent.activeObj = extend({}, parent.objColl[i as number], {}, true) as SelectionPoint;
                const temp: SelectionPoint = extend({}, parent.objColl[i as number], {}, true) as SelectionPoint;
                parent.objColl.splice(i, 1);
                if (parent.transform.degree === 0) {
                    const temp: string = this.lowerContext.filter;
                    this.lowerContext.clearRect(0, 0, parent.lowerCanvas.width, parent.lowerCanvas.height);
                    parent.notify('draw', { prop: 'drawImage', onPropertyChange: false});
                    this.lowerContext.filter = 'none';
                    parent.notify('shape', { prop: 'iterateObjColl', onPropertyChange: false});
                    parent.activeObj = extend({}, temp, {}, true) as SelectionPoint;
                    parent.notify('freehand-draw', { prop: 'freehandRedraw', onPropertyChange: false,
                        value: {context: this.lowerContext, points: null} });
                    this.lowerContext.filter = temp;
                    this.getCurrentFlipState();
                } else {
                    const totalPannedInternalPoint: Point = extend({}, parent.panPoint.totalPannedInternalPoint, {}, true) as Point;
                    const destPoints: ActivePoint = {startX: parent.img.destLeft, startY: parent.img.destTop, width: parent.img.destWidth,
                        height: parent.img.destHeight };
                    parent.notify('draw', { prop: 'callUpdateCurrTransState', onPropertyChange: false});
                    parent.panPoint.totalPannedInternalPoint = totalPannedInternalPoint;
                    parent.img.destLeft = destPoints.startX; parent.img.destTop = destPoints.startY;
                    parent.img.destWidth = destPoints.width; parent.img.destHeight = destPoints.height;
                    parent.notify('freehand-draw', { prop: 'freehandRedraw', onPropertyChange: false,
                        value: {context: this.lowerContext, points: null} });
                }
                parent.notify('draw', { prop: 'clearOuterCanvas', onPropertyChange: false, value: {context: this.lowerContext}});
                if ((parent.currSelectionPoint && parent.currSelectionPoint.shape === 'crop-circle') || parent.isCircleCrop) {
                    parent.notify('crop', { prop: 'cropCircle', onPropertyChange: false,
                        value: {context: this.lowerContext, isSave: null, isFlip: null}});
                }
                parent.activeObj = extend({}, temp, {}, true) as SelectionPoint;
                this.setActivePoint();
                parent.activeObj = extend({}, temp, {}, true) as SelectionPoint;
                const tempStrokeSettings: StrokeSettings = extend({}, parent.activeObj.strokeSettings, {}, true) as StrokeSettings;
                parent.notify('draw', { prop: 'setTempStrokeSettings', onPropertyChange: false,
                    value: {tempStrokeSettings: tempStrokeSettings }});
                const tempTextSettings: TextSettings = extend({}, parent.activeObj.textSettings, {}, true) as TextSettings;
                parent.notify('draw', { prop: 'setTempTextSettings', onPropertyChange: false, value: {tempTextSettings: tempTextSettings}});
                const shapeSettings: ShapeSettings = this.updatePrevShapeSettings();
                const shapeChangingArgs: ShapeChangeEventArgs = {cancel: false, action: 'select', previousShapeSettings: shapeSettings,
                    currentShapeSettings: shapeSettings};
                if (parent.activeObj.shape === 'line' || parent.activeObj.shape === 'arrow') {
                    shapeChangingArgs.currentShapeSettings.width = parent.activeObj.activePoint.endX - parent.activeObj.activePoint.startX;
                    shapeChangingArgs.currentShapeSettings.height = parent.activeObj.activePoint.endY - parent.activeObj.activePoint.startY;
                }
                this.isCropSelection = false; let splitWords: string[];
                if (parent.activeObj.shape !== undefined) {splitWords = parent.activeObj.shape.split('-'); }
                if (splitWords !== undefined && splitWords[0] === 'crop'){
                    this.isCropSelection = true;
                }
                if (!this.isCropSelection && isBlazor() && isNullOrUndefined(parent.eventType) &&
                    parent.events && parent.events.shapeChanging.hasDelegate === true) {
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    (parent.dotNetRef.invokeMethodAsync('ShapeEventAsync', 'OnShape',  shapeChangingArgs, null) as any).then((shapeChangingArgs: ShapeChangeEventArgs) => {
                        this.shapeEvent(shapeChangingArgs);
                    });
                } else if (!this.isCropSelection) {
                    parent.trigger('shapeChanging', shapeChangingArgs);
                    this.shapeEvent(shapeChangingArgs);
                } else {
                    const selectionChangingArgs: SelectionChangeEventArgs = {action: shapeChangingArgs.action,
                        previousSelectionSettings: {type: parent.getSelectionType(parent.activeObj.shape),
                            startX: shapeChangingArgs.previousShapeSettings.startX,
                            startY: shapeChangingArgs.previousShapeSettings.startY,
                            width: shapeChangingArgs.previousShapeSettings.width,
                            height: shapeChangingArgs.previousShapeSettings.height},
                        currentSelectionSettings: {type: parent.getSelectionType(parent.activeObj.shape),
                            startX: shapeChangingArgs.currentShapeSettings.startX,
                            startY: shapeChangingArgs.currentShapeSettings.startY,
                            width: shapeChangingArgs.currentShapeSettings.width,
                            height: shapeChangingArgs.currentShapeSettings.height}};
                    if (isBlazor() && parent.events && parent.events.onSelectionResizeStart.hasDelegate === true) {
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        (parent.dotNetRef.invokeMethodAsync('SelectionEventAsync', 'OnSelectionResizeStart', selectionChangingArgs) as any).then((selectionChangingArgs: SelectionChangeEventArgs) => {
                            shapeChangingArgs.currentShapeSettings.startX = selectionChangingArgs.currentSelectionSettings.startX;
                            shapeChangingArgs.currentShapeSettings.startY = selectionChangingArgs.currentSelectionSettings.startY;
                            shapeChangingArgs.currentShapeSettings.width = selectionChangingArgs.currentSelectionSettings.width;
                            shapeChangingArgs.currentShapeSettings.height = selectionChangingArgs.currentSelectionSettings.height;
                            this.shapeEvent(shapeChangingArgs);
                        });
                    } else {
                        parent.trigger('selectionChanging', selectionChangingArgs);
                        shapeChangingArgs.currentShapeSettings.startX = selectionChangingArgs.currentSelectionSettings.startX;
                        shapeChangingArgs.currentShapeSettings.startY = selectionChangingArgs.currentSelectionSettings.startY;
                        shapeChangingArgs.currentShapeSettings.width = selectionChangingArgs.currentSelectionSettings.width;
                        shapeChangingArgs.currentShapeSettings.height = selectionChangingArgs.currentSelectionSettings.height;
                        this.shapeEvent(shapeChangingArgs);
                    }
                }
                isShape = true;
                if (isBlazor()) {
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    const tempCursor: any = parent.upperCanvas.style.cursor;
                    this.setCursor(x, y);
                    if (shapeChangingArgs.action === 'select' && parent.upperCanvas.style.cursor === 'move') {
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        (parent as any).getShapeValue(parent.activeObj.shape);
                    }
                    parent.upperCanvas.style.cursor = tempCursor;
                }
            }
        }
        return isShape;
    }

    private shapeEvent(shapeChangingArgs: ShapeChangeEventArgs): void {
        const parent: ImageEditor = this.parent;
        parent.notify('shape', { prop: 'updateShapeChangeEventArgs', onPropertyChange: false,
            value: {shapeSettings: shapeChangingArgs.currentShapeSettings}});
        if (parent.activeObj.activePoint) {
            const obj: Object = {prevActObj: null };
            parent.notify('draw', { prop: 'getPrevActObj', onPropertyChange: false, value: {obj: obj }});
            if (isNullOrUndefined(obj['prevActObj'])) {
                parent.notify('draw', { prop: 'setPrevActObj', onPropertyChange: false,
                    value: { prevActObj: extend({}, parent.activeObj, {}, true) }});
            }
            if (parent.activeObj.shape === 'image' && !this.isImageClarity) {
                this.upgradeImageQuality();
                this.isImageClarity = true;
            }
            parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: parent.activeObj, isCropRatio: null,
                points: null, isPreventDrag: true, saveContext: null, isPreventSelection: true} });
            if (!this.isShapeInserted) {
                const { activePoint } = parent.activeObj;
                const { destLeft, destWidth, destTop, destHeight } = parent.img;
                this.isPreventDragging =
                    activePoint.startX < destLeft ||
                    activePoint.endX > destLeft + destWidth ||
                    activePoint.startY < destTop ||
                    activePoint.endY > destTop + destHeight;
            }
        }
    }

    private upgradeImageQuality(): void {
        const parent: ImageEditor = this.parent;
        const activeObj: SelectionPoint = extend({}, parent.activeObj, null, true) as SelectionPoint;
        const ctx: CanvasRenderingContext2D = parent.activeObj.imageCanvas.getContext('2d');
        const dimObj: Object = {width: 0, height: 0 };
        parent.notify('transform', { prop: 'calcMaxDimension', onPropertyChange: false, value: {width: parent.activeObj.imageElement.width,
            height: parent.activeObj.imageElement.height, obj: dimObj, isImgShape: null }});
        parent.notify('shape', { prop: 'updateObj', onPropertyChange: false, value: { dimObj: dimObj, x: null, y: null }});
        ctx.clearRect(0, 0, parent.activeObj.imageCanvas.width, parent.activeObj.imageCanvas.height);
        this.applyTransformToImg(ctx);
        parent.activeObj = activeObj;
    }

    private applyTransformToImg(ctx: CanvasRenderingContext2D): void {
        const parent: ImageEditor = this.parent;
        if (parent.activeObj.isHorImageFlip && parent.activeObj.isVerImageFlip) {
            parent.activeObj.isHorImageFlip = parent.activeObj.isVerImageFlip = false;
            parent.notify('draw', { prop: 'downScaleImgCanvas', onPropertyChange: false,
                value: { ctx: ctx, isImgAnnotation: true, isHFlip: true, isVFlip: true } });
        } else if (parent.activeObj.isHorImageFlip) {
            parent.activeObj.isHorImageFlip = false;
            parent.notify('draw', { prop: 'downScaleImgCanvas', onPropertyChange: false,
                value: { ctx: ctx, isImgAnnotation: true, isHFlip: true, isVFlip: false } });
        } else if (parent.activeObj.isVerImageFlip) {
            parent.activeObj.isVerImageFlip = false;
            parent.notify('draw', { prop: 'downScaleImgCanvas', onPropertyChange: false,
                value: { ctx: ctx, isImgAnnotation: true, isHFlip: false, isVFlip: true } });
        } else {
            parent.notify('draw', { prop: 'downScaleImgCanvas', onPropertyChange: false,
                value: { ctx: ctx, isImgAnnotation: true, isHFlip: false, isVFlip: false } });
        }
    }

    // eslint-disable-next-line
    private targetTouches(touches: any): Point[] {
        const bbox: DOMRect = this.parent.lowerCanvas.getBoundingClientRect() as DOMRect;
        const p1: Point = {x: touches[0].pageX - bbox.left, y: touches[0].pageY - bbox.top};
        const p2: Point = {x: touches[1].pageX - bbox.left, y: touches[1].pageY - bbox.top};
        const points: Point[] = [p1, p2];
        return points;
    }

    private calculateScale(startTouches: Point[], endTouches: Point[]): number {
        const startDistance: number = this.getDistance(startTouches[0], startTouches[1]);
        const endDistance: number = this.getDistance(endTouches[0], endTouches[1]);
        return endDistance / startDistance;
    }

    private getDistance(a: Point, b: Point): number {
        let x: number = 0; let y: number = 0;
        if (a && b) {
            x = a.x - b.x;
            y = a.y - b.y;
        }
        return Math.sqrt(x * x + y * y);
    }

    private redrawShape(obj: SelectionPoint, isMouseUp?: boolean): void {
        const parent: ImageEditor = this.parent;
        for (let i: number = 0, len: number = parent.objColl.length; i < len; i++) {
            if (JSON.stringify(obj) === JSON.stringify(parent.objColl[i as number])) {
                parent.objColl.splice(i, 1);
                break;
            }
        }
        this.upperContext.clearRect(0, 0 , parent.upperCanvas.width, parent.upperCanvas.height);
        if (this.isPreventDragging) {
            if (parent.activeObj.activePoint.startX > parent.img.destLeft) {this.isPreventDragging = false; }
            if (isMouseUp && parent.activeObj.rotatedAngle !== 0) {
                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: null, isCropRatio: null,
                    points: null, isPreventDrag: true, saveContext: null, isPreventSelection: null }});
            } else {
                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: null, isCropRatio: null,
                    points: null, isPreventDrag: true, saveContext: null, isPreventSelection: null} });
            }
        }
        else {
            if (isMouseUp && parent.activeObj.rotatedAngle !== 0) {
                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: null, isCropRatio: null,
                    points: null, isPreventDrag: true, saveContext: null, isPreventSelection: null }});
            } else {
                parent.notify('draw', { prop: 'drawObject', onPropertyChange: false, value: {canvas: 'duplicate', obj: null, isCropRatio: null,
                    points: null, isPreventDrag: true, saveContext: null, isPreventSelection: null} });
            }
        }
    }

    private setTimer(e: MouseEvent & TouchEvent): void {
        const parent: ImageEditor = this.parent;
        if (this.timer > 10) {
            clearTimeout(this.timer); this.timer = 0;
            parent.notify('shape', { prop: 'findTextTarget', onPropertyChange: false, value: {e: e}});
            if (Browser.isDevice) {
                this.upperContext.clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
            }
        }
    }

    private applyCurrActObj(x: number, y: number): void {
        const parent: ImageEditor = this.parent;
        let isInside: boolean = false;
        const actObj: SelectionPoint = extend({}, parent.activeObj, {}, true) as SelectionPoint;
        if (isNullOrUndefined(actObj.activePoint)) {
            return;
        }
        const { startX, startY, endX, endY } : ActivePoint = actObj.activePoint;
        const radius: number = actObj.topLeftCircle ? actObj.topLeftCircle.radius : 0;
        if ((x >= Math.floor(startX) && x <= Math.ceil(endX) && y >= Math.floor(startY) && y <= Math.ceil(endY))) {
            isInside = true;
        } else if (radius !== 0 && (x >= Math.floor(startX) - radius && x <= Math.ceil(endX) + radius &&
            y >= Math.floor(startY) - radius && y <= Math.ceil(endY) + radius)) {
            isInside = true;
            this.tempActiveObj = { activePoint: { startX: 0, startY: 0, endX: 0, endY: 0, width: 0, height: 0 },
                flipObjColl: [], triangle: [], triangleRatio: [] } as SelectionPoint;
        } else if ((actObj.shape === 'text' || actObj.shape === 'image') && this.dragElement !== '') {
            isInside = true;
        } else if (actObj.shape === 'line' || actObj.shape === 'arrow') {
            const smallPoint: Point = {x: startX < endX ? startX : endX, y: startY < endY ? startY : endY};
            const largePoint: Point = {x: startX > endX ? startX : endX, y: startY > endY ? startY : endY};
            if (x >= (Math.floor(smallPoint.x) - 5) && x <= (Math.ceil(largePoint.x) + 5) &&
                y >= (Math.floor(smallPoint.y) - 5) && y <= (Math.ceil(largePoint.y) + 5)) {
                isInside = true;
            }
        } else if (actObj.shape === 'path') {
            const cursor: string = this.setCursorForPath(actObj, x, y, parent.upperCanvas);
            if (cursor === 'move') {
                isInside = true;
            }
        } else if (this.dragElement === 'grabbing') {
            isInside = true;
        } else if (actObj.rotatedAngle !== 0) {
            const cursor: string = this.setCursorForRotatedObject(actObj, x, y, parent.upperCanvas);
            if ((cursor !== 'default' && cursor !== 'grab') || this.dragElement === 'n-resize' || this.dragElement === 'e-resize' ||
                this.dragElement === 's-resize' || this.dragElement === 'w-resize') {
                isInside = true;
            }
        } else if (parent.textArea.style.display === 'block' || parent.textArea.style.display === 'inline-block') {
            isInside = true;
        }
        if (!isInside) {
            if (isNullOrUndefined(parent.activeObj.currIndex)) {
                const shapeIDObj: Object = {id: 'shape_' + (parent.objColl.length + 1) };
                parent.notify('shape', { prop: 'getNewShapeId', onPropertyChange: false, value: {obj: shapeIDObj }});
                parent.activeObj.currIndex = shapeIDObj['id'];
            }
            parent.notify('shape', { prop: 'updImgRatioForActObj', onPropertyChange: false});
            if (parent.activeObj.horTopLine !== undefined && parent.activeObj.horTopLine.startX !== 0 && parent.activeObj.horTopLine.endX
                !== 0 && !parent.currObjType.isCustomCrop && parent.currObjType.shape !== '') {
                parent.objColl.push(extend({}, parent.activeObj, {}, true) as SelectionPoint);
            }
            const shapeColl: string[] = ['rectangle', 'ellipse', 'line', 'arrow', 'path', 'text', 'image'];
            if (shapeColl.indexOf(parent.activeObj.shape) > -1) {
                const tempFilter: string = this.lowerContext.filter;
                this.lowerContext.filter = 'brightness(' + 1 + ') ' + 'contrast(' + 100 + '%) ' + 'hue-rotate(' + 0 + 'deg) ' +
                    'saturate(' + 100 + '%) ' + 'opacity(' + 1 + ') ' + 'blur(' + 0 + 'px) ' + 'sepia(0%) ' + 'grayscale(0%) ' +
                    'invert(0%)';
                for (let i: number = 0; i < parent.objColl.length; i++) {
                    const obj: Object = {isInside: false };
                    parent.notify('crop', { prop: 'isObjInImage', onPropertyChange: false,
                        value: {obj: parent.objColl[i as number], object: obj }});
                    if (obj['isInside']) {
                        parent.notify('shape', { prop: 'apply', onPropertyChange: false,
                            value: {shape: parent.objColl[i as number].shape, obj: parent.objColl[i as number], canvas: null}});
                        parent.notify('shape', { prop: 'refreshActiveObj', onPropertyChange: false});
                    }
                }
                parent.notify('freehand-draw', { prop: 'zoomFHDColl', onPropertyChange: false, value: {isPreventApply: null}});
                this.lowerContext.filter = tempFilter;
                if (parent.activeObj.shape) {
                    parent.notify('shape', { prop: 'apply', onPropertyChange: false,
                        value: {shape: null, obj: null, canvas: null}});
                }
                parent.notify('draw', { prop: 'clearOuterCanvas', onPropertyChange: false, value: {context: this.lowerContext}});
                parent.notify('draw', { prop: 'clearOuterCanvas', onPropertyChange: false, value: {context: this.upperContext}});
                if (parent.isCircleCrop) {
                    parent.notify('crop', { prop: 'cropCircle', onPropertyChange: false,
                        value: {context: this.lowerContext, isSave: null, isFlip: null}});
                }
            }
            if (!isBlazor()) {
                parent.notify('toolbar', { prop: 'refresh-main-toolbar', onPropertyChange: false});
            }
        }
    }

    private getCurrentFlipState(): void {
        const parent: ImageEditor = this.parent;
        if (parent.rotateFlipColl.length !== 0) {
            const totalPannedInternalPoint: Point = extend({}, parent.panPoint.totalPannedInternalPoint, {}, true) as Point;
            parent.notify('draw', { prop: 'callUpdateCurrTransState', onPropertyChange: false});
            parent.panPoint.totalPannedInternalPoint = totalPannedInternalPoint;
        } else {
            parent.notify('draw', { prop: 'callUpdateCurrTransState', onPropertyChange: false});
        }
    }

    private setTextBoxStylesToActObj(): void {
        const parent: ImageEditor = this.parent;
        parent.activeObj.textSettings.fontFamily = parent.textArea.style.fontFamily;
        parent.activeObj.strokeSettings.strokeColor = parent.textArea.style.color !== '' &&
        parent.textArea.style.color.split('(')[1] && parent.textArea.style.color.split('(')[1].split(',')[0] &&
        parent.textArea.style.color.split('(')[1].split(',')[1] && parent.textArea.style.color.split('(')[1].split(',')[2]
        && parent.textArea.style.color.split('(')[1].split(',')[3] ?
            this.rgbToHex(parseFloat(parent.textArea.style.color.split('(')[1].split(',')[0]),
                          parseFloat(parent.textArea.style.color.split('(')[1].split(',')[1]),
                          parseFloat(parent.textArea.style.color.split('(')[1].split(',')[2]),
                          parseFloat(parent.textArea.style.color.split('(')[1].split(',')[3])) :
            parent.textArea.style.color;
        if (parent.textArea.style.fontWeight === 'bold') {
            parent.activeObj.textSettings.bold = true;
        } else {
            parent.activeObj.textSettings.bold = false;
        }
        if (parent.textArea.style.fontStyle === 'italic') {
            parent.activeObj.textSettings.italic = true;
        } else {
            parent.activeObj.textSettings.italic = false;
        }
        parent.activeObj.textSettings.fontSize = (parseFloat(parent.textArea.style.fontSize));
    }

    private rgbToHex(r: number, g: number, b: number, a: number): string {
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));
        a = Math.max(0, Math.min(1, a));
        const hexR: string = this.padLeft(r.toString(16), 2, '0');
        const hexG: string = this.padLeft(g.toString(16), 2, '0');
        const hexB: string = this.padLeft(b.toString(16), 2, '0');
        const hexA: string = this.padLeft(Math.round(a * 255).toString(16), 2, '0');
        const hex: string = `#${hexR}${hexG}${hexB}${hexA}`;
        return hex;
    }

    private padLeft(value: string, length: number, padChar: string): string {
        while (value.length < length) {
          value = padChar + value;
        }
        return value;
      }

    private deleteItem(): void {
        const parent: ImageEditor = this.parent; let shapeChangingArgs: ShapeChangeEventArgs = { cancel: false};
        let previousShapeSettings: ShapeSettings = {} as ShapeSettings;
        if (this.isFhdEditing) {
            this.updateFreehandDrawColorChange();
            const prevCropObj: CurrentObject = extend({}, parent.cropObj, {}, true) as CurrentObject;
            const object: Object = {currObj: {} as CurrentObject };
            parent.notify('filter', { prop: 'getCurrentObj', onPropertyChange: false, value: {object: object }});
            const prevObj: CurrentObject = object['currObj'];
            prevObj.objColl = extend([], parent.objColl, [], true) as SelectionPoint[];
            prevObj.pointColl = extend([], parent.pointColl, [], true) as Point[];
            prevObj.afterCropActions = extend([], parent.afterCropActions, [], true) as string[];
            const selPointCollObj: Object = {selPointColl: null };
            parent.notify('freehand-draw', { prop: 'getSelPointColl', onPropertyChange: false,
                value: {obj: selPointCollObj }});
            prevObj.selPointColl = extend([], selPointCollObj['selPointColl'], [], true) as Point[];
            const obj: Object = {freehandDrawSelectedId: null };
            parent.notify('freehand-draw', { prop: 'getFreehandDrawSelectedId', onPropertyChange: false, value: {obj: obj }});
            parent.notify('freehand-draw', {prop: 'deleteFhd', value: { id: obj['freehandDrawSelectedId'] }});
            parent.notify('undo-redo', { prop: 'updateUndoRedoColl', onPropertyChange: false,
                value: {operation: 'deleteFreehandDrawing', previousObj: prevObj, previousObjColl: this.tempObjColl,
                    previousPointColl: prevObj.pointColl, previousSelPointColl: prevObj.selPointColl,
                    previousCropObj: prevCropObj, previousText: null,
                    currentText: null, previousFilter: null, isCircleCrop: null}});
            parent.notify('undo-redo', {prop: 'updateCurrUrc', value: {type: 'ok' }});
            parent.notify('freehand-draw', {prop: 'resetFreehandDrawSelectedId' });
        } else if (parent.textArea.style.display === 'none') {
            const obj: Object = {prevActObj: null };
            parent.notify('draw', { prop: 'getPrevActObj', onPropertyChange: false, value: {obj: obj }});
            if (obj['prevActObj']) {
                obj['prevActObj']['activePoint']['width'] = Math.abs(obj['prevActObj']['activePoint']['width']);
                obj['prevActObj']['activePoint']['height'] = Math.abs(obj['prevActObj']['activePoint']['height']);
            }
            if (obj['prevActObj'] && JSON.stringify(obj['prevActObj']) !== JSON.stringify(parent.activeObj)) {
                const index: string = parent.activeObj.currIndex;
                parent.notify('draw', {prop: 'performCancel', value: {isContextualToolbar: null}});
                for (let i: number = 0, len: number = parent.objColl.length; i < len; i++) {
                    if (parent.objColl[i as number].currIndex === index) {
                        parent.objColl.splice(i, 1);
                        parent.notify('draw', {prop: 'render-image', value: {isMouseWheel: null}});
                        break;
                    }
                }
            }
            const object: Object = {isNewPath: null };
            parent.notify('draw', {prop: 'getNewPath', value: {obj: object}});
            if (object['isNewPath']) {
                parent.notify('shape', { prop: 'refreshActiveObj', onPropertyChange: false});
                this.upperContext.clearRect(0, 0, parent.upperCanvas.width, parent.upperCanvas.height);
                parent.notify('draw', {prop: 'render-image', value: {isMouseWheel: null}});
                if (!isBlazor()) {
                    parent.notify('toolbar', { prop: 'refresh-main-toolbar', onPropertyChange: false});
                } else {
                    parent.updateToolbar(parent.element, 'imageLoaded');
                }
            } else if (parent.activeObj.shape) {
                parent.objColl.push(parent.activeObj);
                const prevCropObj: CurrentObject = extend({}, parent.cropObj, {}, true) as CurrentObject;
                const object: Object = {currObj: {} as CurrentObject };
                parent.notify('filter', { prop: 'getCurrentObj', onPropertyChange: false, value: {object: object }});
                const prevObj: CurrentObject = object['currObj'];
                prevObj.objColl = extend([], parent.objColl, [], true) as SelectionPoint[];
                prevObj.pointColl = extend([], parent.pointColl, [], true) as Point[];
                prevObj.afterCropActions = extend([], parent.afterCropActions, [], true) as string[];
                const selPointCollObj: Object = {selPointColl: null };
                parent.notify('freehand-draw', { prop: 'getSelPointColl', onPropertyChange: false,
                    value: {obj: selPointCollObj }});
                prevObj.selPointColl = extend([], selPointCollObj['selPointColl'], [], true) as Point[];
                parent.objColl.pop();
                previousShapeSettings = this.updatePrevShapeSettings();
                shapeChangingArgs = {cancel: false, action: 'delete', previousShapeSettings: previousShapeSettings, currentShapeSettings: null};
                parent.notify('shape', { prop: 'setKeyHistory', onPropertyChange: false, value: {keyHistory: '' }});
                parent.clearSelection();
                if (isBlazor() && parent.events && parent.events.shapeChanging.hasDelegate === true) {
                    parent.dotNetRef.invokeMethodAsync('ShapeEventAsync', 'OnShape', shapeChangingArgs, null);
                } else {
                    parent.trigger('shapeChanging', shapeChangingArgs);
                    if (!isBlazor()) {
                        parent.notify('toolbar', { prop: 'refresh-main-toolbar', onPropertyChange: false});
                    }
                }
                if (!isNullOrUndefined(prevObj.objColl[prevObj.objColl.length - 1].currIndex)) {
                    parent.notify('undo-redo', { prop: 'updateUndoRedoColl', onPropertyChange: false,
                        value: {operation: 'deleteObj', previousObj: prevObj, previousObjColl: this.tempObjColl,
                            previousPointColl: prevObj.pointColl, previousSelPointColl: prevObj.selPointColl,
                            previousCropObj: prevCropObj, previousText: null,
                            currentText: null, previousFilter: null, isCircleCrop: null}});
                    parent.notify('undo-redo', {prop: 'updateCurrUrc', value: {type: 'ok' }});
                }
            }
            parent.notify('draw', { prop: 'setPrevActObj', onPropertyChange: false, value: { prevActObj: null }});
        }
        if (document.getElementById(parent.element.id + '_quickAccessToolbarArea')) {
            document.getElementById(parent.element.id + '_quickAccessToolbarArea').style.display = 'none';
        }
    }

    private updateFreehandDrawColorChange(): void {
        const parent: ImageEditor = this.parent; const indexObj: Object = {freehandSelectedIndex: null };
        parent.notify('freehand-draw', {prop: 'getFreehandSelectedIndex', onPropertyChange: false, value: {obj: indexObj }});
        if (!isNullOrUndefined(indexObj['freehandSelectedIndex']) && !isNullOrUndefined(parent.pointColl[indexObj['freehandSelectedIndex']])
            && parent.pointColl[indexObj['freehandSelectedIndex']].strokeColor === '#42a5f5') {
            const obj: Object = {tempFreeHandDrawEditingStyles: null };
            parent.notify('freehand-draw', {prop: 'getTempFreeHandDrawEditingStyles', value: {obj: obj }});
            parent.pointColl[indexObj['freehandSelectedIndex']].strokeColor = obj['tempFreeHandDrawEditingStyles'].strokeColor;
        }
    }

    private updatePrevShapeSettings(obj?: Object): ShapeSettings {
        const parent: ImageEditor = this.parent; const fontStyle: string[] = [];
        if (parent.activeObj.shape === 'text' && parent.activeObj.textSettings) {
            if (parent.activeObj.textSettings.bold) {
                fontStyle.push('bold');
            }
            if (parent.activeObj.textSettings.italic) {
                fontStyle.push('italic');
            }
            if (parent.activeObj.textSettings.underline) {
                fontStyle.push('underline');
            }
        }
        const { startX, startY, width, height } : ActivePoint = parent.activeObj.activePoint;
        const { keyHistory, currIndex, shape, textSettings, strokeSettings, rotatedAngle, imageElement, opacity } = parent.activeObj;
        const shapeSettingsObj: ShapeSettings = {
            id: !isNullOrUndefined(currIndex) ? currIndex : null,
            type: parent.toPascalCase(shape) as ShapeType,
            startX: startX, startY: startY, width: width, height: height,
            strokeColor: strokeSettings ? strokeSettings.strokeColor : null,
            strokeWidth: strokeSettings ? strokeSettings.strokeWidth : null,
            fillColor: strokeSettings ? strokeSettings.fillColor : null,
            radius: shape === 'ellipse' ? width / 2 : null,
            length: shape === 'line' || shape === 'arrow' ? width : null,
            text: shape === 'text' ? (keyHistory ? keyHistory : (textSettings.text ? textSettings.text : null)) : null,
            fontSize: shape === 'text' ? (textSettings ? textSettings.fontSize : null) : null,
            fontFamily: shape === 'text' ? (textSettings ? textSettings.fontFamily : null) : null,
            fontStyle: shape === 'text' ? fontStyle : null,
            color: shape === 'text' ? (strokeSettings ? strokeSettings.strokeColor : null) : null,
            degree: shape === 'ellipse' || shape === 'rectangle' || shape === 'image' ? rotatedAngle * (180 / Math.PI) : null,
            imageData: shape === 'image' ? imageElement.src : null,
            opacity: shape === 'image' ? opacity : null
        };
        if (obj) { obj['shapeSettingsObj'] = shapeSettingsObj; }
        return shapeSettingsObj;
    }

    private getRectanglePoints(rectX: number, rectY: number, rectWidth: number, rectHeight: number, rectAngle: number,
                               pointX: number, pointY: number): boolean {
        const centerX: number = rectX + rectWidth / 2; const centerY: number = rectY + rectHeight / 2;
        const angleRad: number = rectAngle * (Math.PI / 180); const cosAngle: number = Math.cos(angleRad);
        const sinAngle: number = Math.sin(angleRad); const localX: number = pointX - centerX; const localY: number = pointY - centerY;
        const rotatedX: number = localX * cosAngle + localY * sinAngle; const rotatedY: number = -localX * sinAngle + localY * cosAngle;
        const halfWidth: number = rectWidth / 2; const halfHeight: number = rectHeight / 2;
        if (rotatedX >= -halfWidth && rotatedX <= halfWidth && rotatedY >= -halfHeight &&
            rotatedY <= halfHeight) {
            return true;
        } else {
            return false;
        }
    }

    private getTransRotationPoint(obj: SelectionPoint, object?: Object): Point {
        let rotationCirclePoint: Point; let degree: number; let isHorizontalflip: boolean = false; let isVerticalflip: boolean = false;
        degree = (obj.shapeDegree === 0) ? this.parent.transform.degree : this.parent.transform.degree - obj.shapeDegree;
        if (degree < 0) { degree = 360 + degree; }
        if (obj.flipObjColl) {
            for (let i: number = 0, iLen: number = obj.flipObjColl.length; i < iLen; i++) {
                if (obj.flipObjColl[i as number].toLowerCase() === 'horizontal') {
                    isHorizontalflip = true;
                } else if (obj.flipObjColl[i as number].toLowerCase() === 'vertical') {
                    isVerticalflip = true;
                }
            }
        }
        if (degree === 0 || degree === 360) {
            if (isVerticalflip) {
                rotationCirclePoint = {x: obj.topCenterCircle.startX, y: obj.topCenterCircle.startY - obj.rotationCircleLine};
            } else {
                rotationCirclePoint = {x: obj.bottomCenterCircle.startX, y: obj.bottomCenterCircle.startY + obj.rotationCircleLine};
            }
        } else if (degree === 90 || degree === -270) {
            if (isHorizontalflip) {
                rotationCirclePoint = {x: obj.centerRightCircle.startX + obj.rotationCircleLine, y: obj.centerLeftCircle.startY};
            } else {
                rotationCirclePoint = {x: obj.centerLeftCircle.startX - obj.rotationCircleLine, y: obj.centerLeftCircle.startY};
            }
        } else if (degree === 180 || degree === -180) {
            if (isVerticalflip) {
                rotationCirclePoint = {x: obj.bottomCenterCircle.startX, y: obj.bottomCenterCircle.startY + obj.rotationCircleLine};
            } else {
                rotationCirclePoint = {x: obj.topCenterCircle.startX, y: obj.topCenterCircle.startY - obj.rotationCircleLine};
            }
        } else if (degree === 270 || degree === -90) {
            if (isHorizontalflip) {
                rotationCirclePoint = {x: obj.centerLeftCircle.startX - obj.rotationCircleLine, y: obj.centerLeftCircle.startY};
            } else {
                rotationCirclePoint = {x: obj.centerRightCircle.startX + obj.rotationCircleLine, y: obj.centerLeftCircle.startY};
            }
        }
        if (object) { object['rotationCirclePoint'] = rotationCirclePoint; }
        return rotationCirclePoint;
    }

    private getNumTextValue(obj?: Object): Point {
        const parent: ImageEditor = this.parent; const elem: HTMLElement = parent.element as HTMLElement;
        let height: number; let width: number; let widthElement: HTMLInputElement; let heightElement: HTMLInputElement;
        if (isBlazor()) {
            widthElement = elem.querySelector('.e-ie-toolbar-e-resize-width-input .e-textbox');
            heightElement = elem.querySelector('.e-ie-toolbar-e-resize-height-input .e-textbox');
        } else {
            widthElement = (elem.querySelector('#' + elem.id + '_resizeWidth') as HTMLInputElement);
            heightElement = (elem.querySelector('#' + elem.id + '_resizeHeight') as HTMLInputElement);
        }
        if (widthElement && heightElement) {
            let heightString: string = heightElement.value.replace(/,/g, '');
            let widthString: string = widthElement.value.replace(/,/g, '');
            if (heightString === '') {
                heightString = heightElement.placeholder.replace(/,/g, '');
            }
            if (widthString === '') {
                widthString = widthElement.placeholder.replace(/,/g, '');
            }
            height = parseFloat(heightString);
            width  = parseFloat(widthString);
        }
        if (obj) {
            obj['width'] = width; obj['height'] = height;
        }
        return {x: width, y: height };
    }

    private isValueUpdated(): boolean {
        let isValue: boolean = true; let widthElement: HTMLInputElement; let heightElement: HTMLInputElement;
        if (!isBlazor()) {
            widthElement = (this.parent.element.querySelector('#' + this.parent.element.id + '_resizeWidth') as HTMLInputElement);
            heightElement = (this.parent.element.querySelector('#' + this.parent.element.id + '_resizeHeight') as HTMLInputElement);
        } else {
            widthElement = this.parent.element.querySelector('.e-ie-toolbar-e-resize-width-input .e-textbox');
            heightElement = this.parent.element.querySelector('.e-ie-toolbar-e-resize-height-input .e-textbox');
        }
        if (widthElement && heightElement) {
            if (heightElement.value.replace(/,/g, '') === '' && widthElement.value.replace(/,/g, '') === '') {
                isValue = false;
            }
        }
        return isValue;
    }
}
