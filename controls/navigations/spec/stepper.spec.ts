import { createElement, EventHandler, remove, isNullOrUndefined} from '@syncfusion/ej2-base';
import { Stepper, StepperChangedEventArgs, StepperChangingEventArgs, StepperClickEventArgs, StepperRenderingEventArgs, StepLabelPosition } from '../src/stepper/index';
import { StepModel, StepperBase, StepperOrientation } from '../src/stepper-base/index';
import { getMemoryProfile, inMB, profile } from './common.spec';

describe('Stepper', () => {
    beforeAll(() => {
        const isDef: any = (o: any) => o !== undefined && o !== null;
        if (!isDef(window.performance)) {
            console.log('Unsupported environment, window.performance.memory is unavailable');
            this.skip(); // skips test (in Chai)
            return;
        }
    });

    describe('DOM', () => {
        let stepper: Stepper;
        let stepperBase: StepperBase;
        let stepperElement: HTMLElement;

        beforeEach(() => {
            stepperElement = createElement('div', { id: 'stepper'});
            document.body.appendChild(stepperElement);
        });

        afterEach(() => {
            if (stepper) {
                stepper.destroy();
                stepper = undefined;
            }
            remove(stepperElement);
        });

        it('Default stepper testing', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}]
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('1');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('2');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('3');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('4');
        });

        it('Get component name testing', () => {
            stepper = new Stepper({steps: [{}, {}, {}, {}]});
            stepperBase = new StepperBase();
            stepper.appendTo('#stepper');
            expect(stepper.getModuleName()).toEqual('stepper');
            expect(stepperBase.getModuleName()).toEqual('stepperBase');
        });

        it('Stepper testing with Persistence', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                enablePersistence: true
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
        });

        it('Generic nav Element ID generation', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}]
            });
            const stepperEle1 = createElement('nav', {});
            document.body.appendChild(stepperEle1);
            stepper.appendTo(stepperEle1);
            expect(stepperEle1.getAttribute('id') != stepperElement.getAttribute('id')).toEqual(true);
            expect(isNullOrUndefined(stepperEle1.id)).toBe(false);
            stepper.destroy();
            stepper = undefined;
            remove(stepperEle1);
        });
    });

    describe('DOM Properties', () => {
        let stepper: Stepper;
        let stepperElement: HTMLElement;

        beforeEach(() => {
            stepperElement = createElement('nav', { id: 'stepper'});
            document.body.appendChild(stepperElement);
        });

        afterEach(() => {
            if (stepper) {
                stepper.destroy();
                stepper = undefined;
            }
            remove(stepperElement);
        });

        it('Disabled', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people'},
                {iconCss: 'e-icons e-signature', disabled: true},
                {iconCss: 'e-icons e-location'},
                {iconCss: 'e-icons e-cut'},
                {iconCss: 'e-icons e-print-2'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelector('.e-step-disabled') != null).toEqual(true);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(2);
        });

        it('Read Only', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                readOnly: true
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper-readonly')).toEqual(true);
            stepper.readOnly = false;
            stepper.dataBind();
            expect(stepperElement.classList.contains('e-stepper-readonly')).toEqual(false);
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('1');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('2');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('3');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('4');
            stepper.readOnly = true;
            stepper.dataBind();
            expect(stepperElement.classList.contains('e-stepper-readonly')).toEqual(true);
        });

        it('cssClass', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                cssClass: 'testClass'
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('testClass')).toBe(true);
            stepper.cssClass = 'newClass';
            stepper.dataBind();
            expect(stepperElement.classList.contains('newClass')).toBe(true);
            expect(stepperElement.classList.contains('testClass')).toBe(false);
        });

        it('step with cssClass', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', cssClass: 'testClass'},
                {iconCss: 'e-icons e-signature'},
                {iconCss: 'e-icons e-location'},
                {iconCss: 'e-icons e-cut'},
                {iconCss: 'e-icons e-print-2'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelector('.e-step-container').classList).toContain('testClass');
        });

        it('stepper with template support', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1'},
                {iconCss: 'e-icons e-folder', text: 'Step 2'},
                {iconCss: 'e-icons e-folder', text: 'Step 3'},
                {iconCss: 'e-icons e-folder', text: 'Step 4'},
                {iconCss: 'e-icons e-folder', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, template: '<span>${currentStep}</span>' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('0');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('1');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('2');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('3');
            expect((liElementArray[4] as HTMLElement).innerText).toEqual('4');
            stepper.template = '<span>Step ${currentStep}</span>';
            stepper.dataBind();
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Step 0');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Step 1');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Step 2');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Step 3');
            expect((liElementArray[4] as HTMLElement).innerText).toEqual('Step 4');
        });

        it('stepper Template as js renderer ', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1'},
                {iconCss: 'e-icons e-folder', text: 'Step 2'},
                {iconCss: 'e-icons e-folder', text: 'Step 3'},
                {iconCss: 'e-icons e-folder', text: 'Step 4'},
                {iconCss: 'e-icons e-folder', text: 'Step 5'}
            ];
            let template = '<span class="tempContent">Step ${currentStep}</span>';
            const renderer = createElement('script', { id: 'stepTemp', innerHTML: template });
            renderer.setAttribute('type', 'text/x-jsrender');
            document.body.appendChild(renderer);
            stepper = new Stepper({ steps: customData, template: '#stepTemp' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect(stepperElement.querySelector('.e-step-container').firstElementChild.classList).toContain('tempContent');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Step 0');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Step 1');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Step 2');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Step 3');
            expect((liElementArray[4] as HTMLElement).innerText).toEqual('Step 4');
            template = null;
            remove(renderer);
        });

        it('stepper Template as HTMLElement ', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1'},
                {iconCss: 'e-icons e-folder', text: 'Step 2'},
                {iconCss: 'e-icons e-folder', text: 'Step 3'},
                {iconCss: 'e-icons e-folder', text: 'Step 4'},
                {iconCss: 'e-icons e-folder', text: 'Step 5'}
            ];
            const template = '<span class="tempContent">Step ${currentStep}</span>';
            const tempContent = createElement('div', { id: 'stepTemp', className: 'tempContent', innerHTML: template });
            document.body.appendChild(tempContent);
            stepper = new Stepper({ steps: customData, template: '#stepTemp' });
            stepper.appendTo('#stepper');
            expect(document.querySelector('.tempContent') === null).toEqual(false);
            stepper.template = '#labelTemp1';
            stepper.dataBind();
            remove(tempContent);
        });

        it('Default Indicator Type', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                stepType: 'indicator'
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-indicator').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-content').length).toBe(0);
            stepper.activeStep = 2;
            stepper.dataBind();
        });

        it('stepper icon and text with label stepType', () => {
            const customData: StepModel[] = [
                {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                {iconCss: 'sf-icon-location', text: 'Step 2'},
                {iconCss: 'sf-icon-payment', text: 'Step 3'},
                {iconCss: 'sf-icon-preview', text: 'Step 4'},
                {iconCss: 'sf-icon-done', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'label' });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            stepper.stepType = 'indicator';
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            stepper.stepType = 'default';
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
        });

        it('stepper text as indicator', () => {
            const customData: StepModel[] = [
                {text: '1', isValid: true},
                {text: '2', isValid: false},
                {text: '3'},
                {text: '4'},
                {text: '5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'indicator' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-step-type-indicator')).toBe(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(2);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-content').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-valid').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-error').length).toBe(1);
        });

        it('stepper label as indicator', () => {
            const customData: StepModel[] = [
                {label: '1', isValid: true},
                {label: '2', isValid: false},
                {label: '3'},
                {label: '4'},
                {label: '5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'indicator' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-step-type-indicator')).toBe(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(2);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-content').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-valid').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-error').length).toBe(1);
        });

        it('stepper text as label stepType', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2'},
                {text: 'Step 3'},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'label' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-step-type-label')).toBe(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-content').length).toBe(0);
        });

        it('stepper label as label stepType', () => {
            const customData: StepModel[] = [
                {label: 'Step 1'},
                {label: 'Step 2'},
                {label: 'Step 3'},
                {label: 'Step 4'},
                {label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'label' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-step-type-label')).toBe(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-content').length).toBe(0);
        });

        it('stepper text and label as label stepType', () => {
            const customData: StepModel[] = [
                {text: '1', label: 'Step 1'},
                {text: '2', label: 'Step 2'},
                {text: '3', label: 'Step 3'},
                {text: '4', label: 'Step 4'},
                {text: '5', label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'label' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-step-type-label')).toBe(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).innerText).toEqual('Step 1');
            expect((liElementArray[1] as HTMLElement).innerText).toEqual('Step 2');
            expect((liElementArray[2] as HTMLElement).innerText).toEqual('Step 3');
            expect((liElementArray[3] as HTMLElement).innerText).toEqual('Step 4');
            expect((liElementArray[4] as HTMLElement).innerText).toEqual('Step 5');
            stepper.stepType = 'default';
            stepper.dataBind();
            stepper.stepType = 'indicator';
            stepper.dataBind();
        });

        it('stepper with icon as indicator', () => {
            const customData: StepModel[] = [
                {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                {iconCss: 'sf-icon-location', text: 'Step 2'},
                {iconCss: 'sf-icon-payment', text: 'Step 3'},
                {iconCss: 'sf-icon-preview', text: 'Step 4'},
                {iconCss: 'sf-icon-done', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'indicator' });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
        });

        it('stepper with default indicator', () => {
            const customData: StepModel[] = [
                {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                {iconCss: 'sf-icon-location', text: 'Step 2'},
                {iconCss: 'sf-icon-payment', text: 'Step 3'},
                {iconCss: 'sf-icon-preview', text: 'Step 4'},
                {iconCss: 'sf-icon-done', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'default' });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
        });

        it('Label Position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment'},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelector('.e-step-label-container').classList).toContain('e-label-after');
            stepper.labelPosition = 'Top';
            stepper.dataBind();
            expect(stepperElement.querySelector('.e-step-label-container').classList).toContain('e-label-before');
        });

        it('Label Position In Vertical Orientation', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment'},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'Vertical', labelPosition: 'end' });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelector('.e-step-label-container').classList).toContain('e-label-after');
            stepper.labelPosition = 'Start';
            stepper.dataBind();
            expect(stepperElement.querySelector('.e-step-label-container').classList).toContain('e-label-before');
        });

        it('Start Label Position In Vertical Orientation', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment'},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'Vertical', labelPosition: 'start' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList).toContain('e-label-before');
            expect(stepperElement.querySelector('.e-step-label-container').classList).toContain('e-label-before');
        });

        it('Label Position using LabelPosition Enum', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment'},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, labelPosition: StepLabelPosition.Bottom });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelector('.e-step-label-container').classList).toContain('e-label-after');
            stepper.labelPosition = StepLabelPosition.Top;
            stepper.dataBind();
            expect(stepperElement.querySelector('.e-step-label-container').classList).toContain('e-label-before');
        });

        it('stepper with icon only', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people'},
                {iconCss: 'e-icons e-signature'},
                {iconCss: 'e-icons e-location'},
                {iconCss: 'e-icons e-cut'},
                {iconCss: 'e-icons e-print-2'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper with text only', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2'},
                {text: 'Step 3'},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper with text only with validation', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2', isValid: true},
                {text: 'Step 3', isValid: false},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-valid')).toEqual(true);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-error')).toEqual(true);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
            stepper.activeStep = 3;
            stepper.dataBind();
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
        });

        it('stepper with text only with validation in vertical orientation', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2', isValid: true},
                {text: 'Step 3', isValid: false},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'Vertical' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-valid')).toEqual(true);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-error')).toEqual(true);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
            stepper.activeStep = 3;
            stepper.dataBind();
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
        });

        it('stepper with label only', () => {
            const customData: StepModel[] = [
                {label: 'Step 1'},
                {label: 'Step 2'},
                {label: 'Step 3'},
                {label: 'Step 4'},
                {label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            const updatedData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2'},
                {text: 'Step 3'},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper.steps = updatedData;
            stepper.readOnly = true;
            stepper.enableRtl = true;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
        });

        it('stepper with label only with validation', () => {
            const customData: StepModel[] = [
                {label: 'Step 1'},
                {label: 'Step 2', isValid: true},
                {label: 'Step 3', isValid: false},
                {label: 'Step 4'},
                {label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-valid')).toEqual(true);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-error')).toEqual(true);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
            stepper.activeStep = 3;
            stepper.dataBind();
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
        });

        it('stepper with label only with validation in vertical orientaion', () => {
            const customData: StepModel[] = [
                {label: 'Step 1'},
                {label: 'Step 2', isValid: true},
                {label: 'Step 3', isValid: false},
                {label: 'Step 4'},
                {label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'Vertical' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-valid')).toEqual(true);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-error')).toEqual(true);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-check')).toEqual(true);
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
            stepper.activeStep = 3;
            stepper.dataBind();
            expect((liElementArray[2].querySelector('.e-step-validation-icon') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
        });

        it('stepper with icon and text', () => {
            const customData: StepModel[] = [
                {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                {iconCss: 'sf-icon-location', text: 'Step 2'},
                {iconCss: 'sf-icon-payment', text: 'Step 3'},
                {iconCss: 'sf-icon-preview', text: 'Step 4'},
                {iconCss: 'sf-icon-done', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper with optional and valid support', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1'},
                {iconCss: 'e-icons e-folder', text: 'Step 2', isValid: true},
                {iconCss: 'e-icons e-folder', text: 'Step 3', optional: true, isValid: false},
                {iconCss: 'e-icons e-folder', text: 'Step 4'},
                {iconCss: 'e-icons e-folder', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-valid')).toEqual(true);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-error')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-indicator') as HTMLElement).classList.contains('e-folder')).toEqual(false);
            expect((liElementArray[1].querySelector('.e-indicator') as HTMLElement).classList.contains('e-check')).toEqual(true);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect((liElementArray[1].querySelector('.e-indicator') as HTMLElement).classList.contains('e-folder')).toEqual(false);
            expect((liElementArray[1].querySelector('.e-indicator') as HTMLElement).classList.contains('e-check')).toEqual(true);
            expect((liElementArray[2].querySelector('.e-indicator') as HTMLElement).classList.contains('e-folder')).toEqual(false);
            expect((liElementArray[2].querySelector('.e-indicator') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
            stepper.activeStep = 3;
            stepper.dataBind();
            expect((liElementArray[2].querySelector('.e-indicator') as HTMLElement).classList.contains('e-folder')).toEqual(false);
            expect((liElementArray[2].querySelector('.e-indicator') as HTMLElement).classList.contains('e-circle-info')).toEqual(true);
        });

        it('stepper icon with default label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            stepper.enableRtl = true;
            stepper.dataBind();
            expect(stepperElement.classList.contains('e-rtl')).toEqual(true);
        });

        it('stepper icon with default label position in rtl mode', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, enableRtl: true });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('e-rtl')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);

        });

        it('stepper icon with start label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, labelPosition: 'start' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper icon with before label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, labelPosition: 'top' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-after').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper text with default label position', () => {
            const customData: StepModel[] = [
                {text: 'Step 1', label: 'Purchase'},
                {text: 'Step 2', label: 'Location'},
                {text: 'Step 3', label: 'Payment', optional: true},
                {text: 'Step 4', label: 'Preview'},
                {text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            stepperElement.style.width = '500px';
        });

        it('stepper icon, text with default label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', text: 'Step 2', label: 'Location'},
                {iconCss: 'e-icons e-folder', text: 'Step 3', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', text: 'Step 4', label: 'Preview'},
                {iconCss: 'e-icons e-folder', text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            stepper.labelPosition = 'top';
            stepper.dataBind();
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(0);
        });

        it('stepper icon, text with before label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', text: 'Step 2', label: 'Location'},
                {iconCss: 'e-icons e-folder', text: 'Step 3', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', text: 'Step 4', label: 'Preview'},
                {iconCss: 'e-icons e-folder', text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, labelPosition: 'top' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(0);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            stepper.labelPosition = 'bottom';
            stepper.dataBind();
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(0);
        });

        it('Vertical stepper rendering', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                orientation: 'vertical'
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper with icon only in vertical orientation', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people'},
                {iconCss: 'e-icons e-signature'},
                {iconCss: 'e-icons e-location', optional: true},
                {iconCss: 'e-icons e-cut'},
                {iconCss: 'e-icons e-print-2'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper with text only in vertical orientation', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2'},
                {text: 'Step 3', optional: true},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, orientation: StepperOrientation.Vertical });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper with icon and text in vertical orientation', () => {
            const customData: StepModel[] = [
                {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                {iconCss: 'sf-icon-location', text: 'Step 2', optional: true},
                {iconCss: 'sf-icon-payment', text: 'Step 3'},
                {iconCss: 'sf-icon-preview', text: 'Step 4'},
                {iconCss: 'sf-icon-done', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper icon with label in vertical orientation', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location', optional: true},
                {iconCss: 'e-icons e-folder', label: 'Payment'},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical', labelPosition: 'end' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper icon with before label position in vertical orientation', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', label: 'Location'},
                {iconCss: 'e-icons e-folder', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', label: 'Preview'},
                {iconCss: 'e-icons e-folder', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical', labelPosition: 'start' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-after').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper text with default label position', () => {
            const customData: StepModel[] = [
                {text: 'Step 1', label: 'Purchase'},
                {text: 'Step 2', label: 'Location'},
                {text: 'Step 3', label: 'Payment', optional: true},
                {text: 'Step 4', label: 'Preview'},
                {text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-bottom').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper text with before label position', () => {
            const customData: StepModel[] = [
                {text: 'Step 1', label: 'Purchase'},
                {text: 'Step 2', label: 'Location'},
                {text: 'Step 3', label: 'Payment', optional: true},
                {text: 'Step 4', label: 'Preview'},
                {text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical', labelPosition: 'start' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(0);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper icon, text with default label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', text: 'Step 2', label: 'Location'},
                {iconCss: 'e-icons e-folder', text: 'Step 3', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', text: 'Step 4', label: 'Preview'},
                {iconCss: 'e-icons e-folder', text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('e-label-bottom')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(0);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper icon, text with before label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', text: 'Step 2', label: 'Location'},
                {iconCss: 'e-icons e-folder', text: 'Step 3', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', text: 'Step 4', label: 'Preview'},
                {iconCss: 'e-icons e-folder', text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical', labelPosition: 'start' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(0);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('stepper icon, text with end label position', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-folder', text: 'Step 1', label: 'Purchase'},
                {iconCss: 'e-icons e-folder', text: 'Step 2', label: 'Location'},
                {iconCss: 'e-icons e-folder', text: 'Step 3', label: 'Payment', optional: true},
                {iconCss: 'e-icons e-folder', text: 'Step 4', label: 'Preview'},
                {iconCss: 'e-icons e-folder', text: 'Step 5', label: 'Success'}
            ];
            stepper = new Stepper({ steps: customData, orientation: 'vertical', labelPosition: 'end' });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-label-optional').length).toBe(1);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-steps-vertical') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-label-container').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-after').length).toBe(5);
            expect(stepperElement.querySelector('.e-stepper-steps').querySelectorAll('.e-label-before').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('Dynamic stepper active step testing', () => {
            stepper = new Stepper({steps: [{}, {}, {}, {}]});
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(2);
        });

        it('Dynamic stepper orientation testing', () => {
            const customData: StepModel[] = [
                {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                {iconCss: 'sf-icon-location', text: 'Step 2'},
                {iconCss: 'sf-icon-payment', text: 'Step 3'},
                {iconCss: 'sf-icon-preview', text: 'Step 4'},
                {iconCss: 'sf-icon-done', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            stepper.orientation = 'vertical';
            stepper.dataBind();
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-vertical') != null).toEqual(true);
            stepper.orientation = 'horizontal';
            stepper.dataBind();
            expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
        });

        it('stepper with completed status', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people'},
                {iconCss: 'e-icons e-signature'},
                {iconCss: 'e-icons e-location', status: 'Completed'},
                {iconCss: 'e-icons e-cut'},
                {iconCss: 'e-icons e-print-2'}
            ];
            stepper = new Stepper({ activeStep: 2, steps: customData });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-completed')).toEqual(true);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-notstarted')).toEqual(true);
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(3);
        });

        it('stepper with notStarted status updating', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people'},
                {iconCss: 'e-icons e-signature'},
                {iconCss: 'e-icons e-location', status: 'InProgress'},
                {iconCss: 'e-icons e-cut'},
                {iconCss: 'e-icons e-print-2'}
            ];
            stepper = new Stepper({ activeStep: 2, steps: customData });
            stepper.appendTo('#stepper');
            stepper.steps[2].status = 'NotStarted';
            stepper.dataBind();
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-notstarted')).toEqual(true);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-notstarted')).toEqual(true);
            expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
            expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
            expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(2);
        });

        it('stepper with default tooltip', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2'},
                {text: 'Step 3'},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: false });
            stepper.appendTo('#stepper');
            expect(document.body.querySelector('.e-tooltip-wrap') == null).toEqual(true);
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            stepper.showTooltip = true;
            stepper.dataBind();
            EventHandler.trigger(liElementArray[1], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[1]);
            expect(document.body.querySelector('.e-tooltip-wrap') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 2');
            EventHandler.trigger(liElementArray[1], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
            stepper.showTooltip = false;
            stepper.dataBind();
            expect(document.body.querySelector('.e-tooltip-wrap') == null).toEqual(true);
        });

        it('stepper with tooltip template', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2'},
                {text: 'Step 3'},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, tooltipTemplate: '<span>testTemplate</span>' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            EventHandler.trigger(liElementArray[1], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[1]);
            expect(document.body.querySelector('.e-stepper-tooltip-content') != null).toEqual(true);
            expect(document.body.querySelector('.e-stepper-tooltip-content').innerHTML).toEqual('<span>testTemplate</span>');
        });

        it('Custom tooltip using cssClass', () => {
            const customData: StepModel[] = [
                {text: 'Step 1'},
                {text: 'Step 2'},
                {text: 'Step 3'},
                {text: 'Step 4'},
                {text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, cssClass: 'testClass' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            (stepper as any).tooltipObj.open(liElementArray[1]);
            expect(document.body.querySelector('.e-stepper-tooltip').classList.contains('testClass')).toEqual(true);
            (stepper as any).tooltipObj.close(liElementArray[1]);
            stepper.cssClass = 'testClass1';
            stepper.dataBind();
            (stepper as any).tooltipObj.open(liElementArray[1]);
            expect(document.body.querySelector('.e-stepper-tooltip').classList.contains('testClass')).toEqual(false);
            expect(document.body.querySelector('.e-stepper-tooltip').classList.contains('testClass1')).toEqual(true);
            (stepper as any).tooltipObj.close(liElementArray[1]);
            stepper.cssClass = '';
            stepper.dataBind();
            (stepper as any).tooltipObj.open(liElementArray[1]);
            expect(document.body.querySelector('.e-stepper-tooltip').classList.contains('testClass1')).toEqual(false);
            (stepper as any).tooltipObj.close(liElementArray[1]);
        });

        it('Custom tooltip with icon & text configured type as indicator', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', text: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', text: 'Step 2'},
                {iconCss: 'e-icons e-location', text: 'Step 3'},
                {iconCss: 'e-icons e-cut', text: 'Step 4'},
                {iconCss: 'e-icons e-print-2', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, stepType: 'indicator' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-step-inprogress-tip.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon & text configured type as indicator dynamically enableTooltip', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', text: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', text: 'Step 2'},
                {iconCss: 'e-icons e-location', text: 'Step 3'},
                {iconCss: 'e-icons e-cut', text: 'Step 4'},
                {iconCss: 'e-icons e-print-2', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, stepType: 'indicator' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).showTooltip = true;
            (stepper as any).dataBind();
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-step-inprogress-tip.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon & text configured checking tooltip', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', text: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', text: 'Step 2'},
                {iconCss: 'e-icons e-location', text: 'Step 3'},
                {iconCss: 'e-icons e-cut', text: 'Step 4'},
                {iconCss: 'e-icons e-print-2', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon & label configured checking tooltip', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', label: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', label: 'Step 2'},
                {iconCss: 'e-icons e-location', label: 'Step 3'},
                {iconCss: 'e-icons e-cut', label: 'Step 4'},
                {iconCss: 'e-icons e-print-2', label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-step-inprogress-tip.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon, text & cssClass', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', text: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', text: 'Step 2'},
                {iconCss: 'e-icons e-location', text: 'Step 3'},
                {iconCss: 'e-icons e-cut', text: 'Step 4'},
                {iconCss: 'e-icons e-print-2', text: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, cssClass: 'testClass' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            (stepper as any).tooltipObj.open(liElementArray[1]);
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-stepper-tooltip.testClass') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip.testClass') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon, label & cssClass', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', label: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', label: 'Step 2'},
                {iconCss: 'e-icons e-location', label: 'Step 3'},
                {iconCss: 'e-icons e-cut', label: 'Step 4'},
                {iconCss: 'e-icons e-print-2', label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, cssClass: 'testClass' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            (stepper as any).tooltipObj.open(liElementArray[1]);
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-step-inprogress-tip.e-stepper-tooltip.testClass') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip.testClass') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon & label configured type as indicator', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', label: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', label: 'Step 2'},
                {iconCss: 'e-icons e-location', label: 'Step 3'},
                {iconCss: 'e-icons e-cut', label: 'Step 4'},
                {iconCss: 'e-icons e-print-2', label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, stepType: 'indicator' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-step-inprogress-tip.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon & label configured type as indicator dynamically enableTooltip', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', label: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', label: 'Step 2'},
                {iconCss: 'e-icons e-location', label: 'Step 3'},
                {iconCss: 'e-icons e-cut', label: 'Step 4'},
                {iconCss: 'e-icons e-print-2', label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, stepType: 'indicator' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).showTooltip = true;
            (stepper as any).dataBind();
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-step-inprogress-tip.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('Custom tooltip with icon, label & cssClass', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people', label: 'Step 1', status: 'inprogress'},
                {iconCss: 'e-icons e-signature', label: 'Step 2'},
                {iconCss: 'e-icons e-location', label: 'Step 3'},
                {iconCss: 'e-icons e-cut', label: 'Step 4'},
                {iconCss: 'e-icons e-print-2', label: 'Step 5'}
            ];
            stepper = new Stepper({ steps: customData, showTooltip: true, cssClass: 'testClass' });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            (stepper as any).tooltipObj.animation = { open: { effect: 'None' }, close: { effect: 'None' } };
            (stepper as any).tooltipObj.open(liElementArray[1]);
            EventHandler.trigger(liElementArray[0], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[0]);
            expect(document.body.querySelector('.e-step-inprogress-tip.e-stepper-tooltip.testClass') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 1');
            EventHandler.trigger(liElementArray[0], 'mouseleave');
            EventHandler.trigger(liElementArray[2], 'mouseover');
            (stepper as any).tooltipObj.open(liElementArray[2]);
            expect(document.body.querySelector('.e-stepper-tooltip.testClass') != null).toEqual(true);
            expect(document.body.querySelector('.e-tip-content').innerHTML).toEqual('Step 3');
        });

        it('stepper with RTL', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                activeStep: 2,
                enableRtl: true,
                animation: {enable: true, duration: 2000, delay: 1000}
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.classList.contains('e-rtl')).toEqual(true);
            stepper.enableRtl = false;
            stepper.dataBind();
            expect(stepperElement.classList.contains('e-rtl')).toEqual(false);
            stepper.animation.enable = false;
            stepper.dataBind();
            stepper.enableRtl = true;
            stepper.dataBind();
            expect(stepperElement.classList.contains('e-rtl')).toEqual(true);
        });

        it('stepper with Linear mode', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                activeStep: 2,
                linear: true
            });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
            EventHandler.trigger(liElementArray[0], 'click');
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(false);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-completed')).toEqual(true);
            stepper.activeStep = 3;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            stepper.activeStep = 5;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            stepper.activeStep = 2;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(2);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(1);
            stepper.activeStep = 1;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
            stepper.activeStep = 0;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            stepper.activeStep = -1;
            stepper.dataBind();
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
        });

        describe('Methods and Events', () => {

            it('stepper with nextStep method', () => {
                const customData: StepModel[] = [
                    {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                    {iconCss: 'sf-icon-location', text: 'Step 2'},
                    {iconCss: 'sf-icon-payment', text: 'Step 3'},
                    {iconCss: 'sf-icon-preview', text: 'Step 4'},
                    {iconCss: 'sf-icon-done', text: 'Step 5'}
                ];
                stepper = new Stepper({ steps: customData });
                stepper.appendTo('#stepper');
                expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
                expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
                expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
                expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
                expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
                stepper.nextStep();
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            });

            it('stepper with previousStep method', () => {
                const customData: StepModel[] = [
                    {iconCss: 'sf-icon-shopping', text: 'Step 1'},
                    {iconCss: 'sf-icon-location', text: 'Step 2'},
                    {iconCss: 'sf-icon-payment', text: 'Step 3'},
                    {iconCss: 'sf-icon-preview', text: 'Step 4'},
                    {iconCss: 'sf-icon-done', text: 'Step 5'}
                ];
                stepper = new Stepper({ steps: customData });
                stepper.appendTo('#stepper');
                expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
                expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
                expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
                expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
                expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
                stepper.nextStep();
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                stepper.previousStep();
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(4);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            });

            it('stepper with reset method', () => {
                stepper = new Stepper({
                    steps: [{}, {}, {}, {}]
                });
                stepper.appendTo('#stepper');
                expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
                expect(stepperElement.classList.contains('.e-stepper') != null).toEqual(true);
                expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
                expect(stepperElement.querySelector('.e-stepper-steps') != null).toEqual(true);
                expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(4);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
                stepper.nextStep();
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                stepper.reset();
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
            });

            it('created Property', () => {
                let isCreated: boolean = false;
                stepper = new Stepper({
                    steps: [{}, {}, {}, {}],
                    created: () => { isCreated = true; }
                });
                stepper.appendTo('#stepper');
                const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
                EventHandler.trigger(liElementArray[1], 'click');
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
                expect(isCreated).toEqual(true);
            });

            it('beforeStepRender Property', () => {
                let count: number = 0;
                stepper = new Stepper({
                    steps: [{}, {}, {}, {}],
                    beforeStepRender: (e: StepperRenderingEventArgs) => {
                        count++;
                        expect(e.element.classList).toContain('e-step-container');
                    }
                });
                stepper.appendTo('#stepper');
                expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(4);
                expect(count).toBe(4);
            });

            it('stepClick Property', () => {
                let isClicked: boolean = false;
                stepper = new Stepper({
                    steps: [{}, {}, {}, {}],
                    stepChanged: (e: StepperClickEventArgs) => {
                        isClicked = true;
                    }
                });
                stepper.appendTo('#stepper');
                const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
                EventHandler.trigger(liElementArray[1], 'click');
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
                expect(isClicked).toEqual(true);
            });

            it('stepChanged Property', () => {
                let stepChanged: boolean = false;
                stepper = new Stepper({
                    steps: [{}, {}, {}, {}],
                    stepChanged: (e: StepperChangedEventArgs) => {
                        stepChanged = true;
                    }
                });
                stepper.appendTo('#stepper');
                const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
                EventHandler.trigger(liElementArray[2], 'click');
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(2);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(1);
                expect(stepChanged).toEqual(true);
            });

            it('stepChanging Property', () => {
                let stepChanging: boolean = false;
                stepper = new Stepper({
                    steps: [{}, {}, {}, {}],
                    stepChanging: (e: StepperChangingEventArgs) => {
                        stepChanging = true;
                    }
                });
                stepper.appendTo('#stepper');
                const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
                EventHandler.trigger(liElementArray[2], 'click');
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(2);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(1);
                expect(stepChanging).toEqual(true);
            });

            it('stepChanging Property change argument as false', () => {
                stepper = new Stepper({
                    steps: [{}, {}, {}, {}],
                    stepChanging: (e: StepperChangingEventArgs) => {
                        e.cancel = true;
                    }
                });
                stepper.appendTo('#stepper');
                const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
                EventHandler.trigger(liElementArray[2], 'click');
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            });

            it('stepper with inprogress status', () => {
                const customData: StepModel[] = [
                    {iconCss: 'e-icons e-people'},
                    {iconCss: 'e-icons e-signature'},
                    {iconCss: 'e-icons e-location', status: 'InProgress'},
                    {iconCss: 'e-icons e-cut'},
                    {iconCss: 'e-icons e-print-2'}
                ];
                stepper = new Stepper({ activeStep: 2, steps: customData });
                stepper.appendTo('#stepper');
                expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
                expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
                const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
                expect((liElementArray[2] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
                expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
                expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
                expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(2);
                stepper.steps[1].status = 'notstarted';
                stepper.dataBind();
                expect((liElementArray[2] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
                stepper.steps[2].status = 'completed';
                stepper.dataBind();
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(3);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(0);
            });

            it('stepper inprogress status with activeStep', () => {
                const customData: StepModel[] = [
                    {iconCss: 'e-icons e-people'},
                    {iconCss: 'e-icons e-signature'},
                    {iconCss: 'e-icons e-location', status: 'InProgress'},
                    {iconCss: 'e-icons e-cut'},
                    {iconCss: 'e-icons e-print-2'}
                ];
                stepper = new Stepper({ activeStep: 1, steps: customData });
                stepper.appendTo('#stepper');
                expect(stepperElement.classList.contains('e-stepper')).toEqual(true);
                expect(stepperElement.classList.contains('.e-horizontal') != null).toEqual(true);
                const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
                expect((liElementArray[1] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
                expect(stepperElement.querySelectorAll('.e-step-container').length).toBe(5);
                expect(stepperElement.querySelectorAll('.e-indicator').length).toBe(5);
                expect(stepperElement.querySelectorAll('.e-step-text-container').length).toBe(0);
                expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
                expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
                expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(1);
            });

        });
    });

    describe('Keyboard Events', () => {
        let stepper: Stepper;
        let stepperElement: HTMLElement;
        let keyboardEventArgs: any;

        beforeEach(() => {
            stepperElement = createElement('div', { id: 'stepper'});
            document.body.appendChild(stepperElement);
            keyboardEventArgs = {
                preventDefault: (): void => { },
                action: null,
                target: null,
                stopImmediatePropagation: (): void => { }
            };
        });

        afterEach(() => {
            if (stepper) {
                stepper.destroy();
                stepper = undefined;
            }
            remove(stepperElement);
        });

        it('Keyboard Combination with stepper horizontal mode', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}]
            });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.target = stepperElement.querySelector('.e-step-container');
            keyboardEventArgs.action = 'uparrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'tab';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'shiftTab';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'enter';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            keyboardEventArgs.action = 'space';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(1);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
            keyboardEventArgs.action = 'home';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            keyboardEventArgs.action = 'end';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            stepper.activeStep = 3;
            stepper.dataBind();
            stepper.linear = true;
            stepper.dataBind();
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            keyboardEventArgs.action = 'enter';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(0);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            keyboardEventArgs.action = 'enter';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            keyboardEventArgs.action = 'enter';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            keyboardEventArgs.action = 'tab';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            // for coverage
            keyboardEventArgs.target = stepperElement.querySelector('.e-step-container');
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            document.body.click();
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(0);
        });

        it('Keyboard Combination with stepper vertical mode', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                orientation: 'vertical'
            });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.target = stepperElement.querySelector('.e-step-container');
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'tab';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'uparrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'shiftTab';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'uparrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'enter';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(2);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            keyboardEventArgs.action = 'space';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(0);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(1);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-inprogress')).toEqual(true);
            (stepper as any).updateStepFocus();
            stepper.readOnly = true;
            stepper.dataBind();
            keyboardEventArgs.action = 'space';
            (stepper as any).keyActionHandler(keyboardEventArgs);
        });

        it('Keyboard Interaction with stepper horizontal in rtl mode', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                enableRtl: true
            });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.target = stepperElement.querySelector('.e-step-container');
            keyboardEventArgs.action = 'uparrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'home';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            keyboardEventArgs.action = 'end';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
        });

        it('Keyboard Interaction with stepper vertical in rtl mode', () => {
            stepper = new Stepper({
                steps: [{}, {}, {}, {}],
                enableRtl: true,
                orientation: 'vertical'
            });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.target = stepperElement.querySelector('.e-step-container');
            keyboardEventArgs.action = 'leftarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'uparrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'uparrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[2] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
        });

        it('Keyboard Combination with stepper disabled item', () => {
            const customData: StepModel[] = [
                {iconCss: 'e-icons e-people'},
                {iconCss: 'e-icons e-signature'},
                {iconCss: 'e-icons e-location', disabled: true},
                {iconCss: 'e-icons e-cut'}
            ];
            stepper = new Stepper({ steps: customData });
            stepper.appendTo('#stepper');
            const liElementArray: any = stepperElement.querySelectorAll('.e-step-container');
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.target = stepperElement.querySelector('.e-step-container');
            keyboardEventArgs.action = 'uparrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'downarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[1] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect((liElementArray[0] as HTMLElement).classList.contains('e-step-selected')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
            keyboardEventArgs.action = 'rightarrow';
            (stepper as any).keyActionHandler(keyboardEventArgs);
            expect((liElementArray[3] as HTMLElement).classList.contains('e-step-focus')).toEqual(true);
            expect(stepperElement.querySelectorAll('.e-step-focus').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-notstarted').length).toBe(3);
        });

        // for coverage

        it('Stepper with single step', () => {
            stepper = new Stepper({
                steps: [{}]
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('Stepper with single step in Vertical mode', () => {
            stepper = new Stepper({
                steps: [{}],
                orientation: 'vertical'
            });
            stepper.appendTo('#stepper');
            expect(stepperElement.querySelectorAll('.e-step-inprogress').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-selected').length).toBe(1);
            expect(stepperElement.querySelectorAll('.e-step-completed').length).toBe(0);
        });

        it('memory leak', () => {
            profile.sample();
            const average: any = inMB(profile.averageChange);
            // check average change in memory samples to not be over 10MB
            expect(average).toBeLessThan(10);
            const memory: any = inMB(getMemoryProfile());
            // check the final memory usage against the first usage, there should be little change if everything was properly deallocated
            expect(memory).toBeLessThan(profile.samples[0] + 0.25);
        });
    });
});
