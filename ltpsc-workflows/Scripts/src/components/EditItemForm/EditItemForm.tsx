import * as React from 'react'
import { ListDataTable } from '../ListDataTable/ListDataTable';
import { inject } from '../../utils/inversify.config'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import ListDataStore from '../../stores/ListDataStore';
import { observer } from 'mobx-react';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import Checkbox from 'material-ui/Checkbox';
import { 
    inputFieldStyles, 
    checkboxStyle, 
    formButtonStyle, 
    suspensionFormButtonStyle, 
    suspensionDialogueStyle, 
    submitFormButtonStyle,
    formModalStyle,
    labelStyle
 } from './Styles_EditItemForm';
import RaisedButton from 'material-ui/RaisedButton';
import { EditFormStatusEnum } from '../../model/EditFormStatusEnum';
import { action } from 'mobx';


@observer
export class EditItemForm extends React.Component<any, any> {

    @inject(ListDataStore)
    private listDataStore: ListDataStore


    render() {
        const actions = [
            <FlatButton disabled={this.listDataStore.asyncPendingLockout} label="Cancel" primary={true} onClick={this.listDataStore.closeEditItemForm} />,
            <FlatButton disabled={this.listDataStore.asyncPendingLockout} label="Save" primary={true} onClick={this.listDataStore.submitEditItemForm} />
        ]

        const validationState = this.listDataStore.currentEditItemValidationState

        return (
            <Dialog title={`${this.listDataStore.currentView.stageName}: ${this.listDataStore.editFormDisplayStatus === EditFormStatusEnum.DISPLAYING_NEW ? 'New' : 'Edit'} Item`} 
                autoScrollBodyContent={true} actions={actions} modal={true} open={this.listDataStore.isDisplayEditItemForm} contentStyle={formModalStyle} >
                <div style={inputFieldStyles}>
                {   /* return to previous stage button */
                    this.listDataStore.currentEditItemInOrderPreviousStage &&
                    (<RaisedButton style={formButtonStyle} label={`return to previous stage - ${this.listDataStore.currentEditItemInOrderPreviousStage}`} 
                        onClick={this.listDataStore.returnEditItemToInOrderPreviousStage} disabled={this.listDataStore.asyncPendingLockout} /> )
                }
                {
                    this.listDataStore.currentView.columns.map((column, index) => {
                        // form the onChange function for the input
                        const updateFunction = (e, newValue) => this.listDataStore.updateCurrentEditItem(column.spName, newValue)

                        // render the appropriate form control
                        if(column.type === 'text') {
                            return <TextField value={this.listDataStore.currentEditItem[column.spName] || ''} key={index} fullWidth={true} disabled={column.displayOnly} floatingLabelStyle={labelStyle}
                                        floatingLabelText={column.required ? `${column.displayName}*` : column.displayName } onChange={updateFunction} errorText={validationState[column.spName]} />
                        } else if(column.type === 'textarea') {
                            return <TextField key={index} fullWidth={true} multiLine={true} floatingLabelText={column.required ? `${column.displayName}*` : column.displayName } disabled={column.displayOnly}
                                        onChange={updateFunction} value={this.listDataStore.currentEditItem[column.spName] || ''} errorText={validationState[column.spName]} floatingLabelStyle={labelStyle} />
                        } else if(column.type === 'choice') {
                            return (
                                <SelectField value={this.listDataStore.currentEditItem[column.spName] || ''} key={index} fullWidth={true} disabled={column.displayOnly} floatingLabelStyle={labelStyle} 
                                    onChange={(e, key, payload) => updateFunction(e, payload)} floatingLabelText={column.required ? `${column.displayName}*` : column.displayName } >
                                {
                                    column.metadata.choices.map((choice, index) => (
                                        <MenuItem key={index} value={choice} primaryText={choice} />
                                    ))
                                }
                                </SelectField>
                            )
                        } else if(column.type === 'lookup') {
                            return (
                                <SelectField value={this.listDataStore.currentEditItem[column.spName]} key={index} fullWidth={true} floatingLabelStyle={labelStyle}
                                    disabled={column.displayOnly} onChange={(e, key, payload) => updateFunction(e, payload)} floatingLabelText={column.required ? `${column.displayName}*` : column.displayName } >
                                {
                                    Object.keys(this.listDataStore.lookupValues.get(column.spName)).map((lookupId, index) => (
                                        <MenuItem key={index} value={Number(lookupId)} primaryText={this.listDataStore.lookupValues.get(column.spName)[lookupId]} />
                                    ))
                                }
                                </SelectField>
                            )
                        } else if(column.type === 'checkbox') {
                            return <Checkbox key={index} style={checkboxStyle} label={column.displayName} disabled={column.displayOnly}
                                        onCheck={updateFunction} checked={!!this.listDataStore.currentEditItem[column.spName]} labelStyle={labelStyle} />
                        } else if(column.type === 'datetime') {
                            return <TextField key={index} fullWidth={true} floatingLabelText={column.required ? `${column.displayName}*` : column.displayName } onChange={updateFunction}
                                        disabled={column.displayOnly} value={this.listDataStore.currentEditItem[column.spName] || ''} errorText={validationState[column.spName]} floatingLabelStyle={labelStyle} />
                        } else if(column.type === 'number') {
                            return <TextField key={index} fullWidth={true} floatingLabelText={column.required ? `${column.displayName}*` : column.displayName } onChange={updateFunction}
                                        disabled={column.displayOnly} value={this.listDataStore.currentEditItem[column.spName] || ''} errorText={validationState[column.spName]} floatingLabelStyle={labelStyle} />
                        }
                    })
                }
                {   /* submit to next stage button */
                    this.listDataStore.currentEditItemNextStage &&
                    (<div style={submitFormButtonStyle}><RaisedButton label={`submit to next stage - ${this.listDataStore.currentEditItemNextStage}`} 
                        onClick={this.listDataStore.submitEditItemToNextStage} disabled={this.listDataStore.asyncPendingLockout} /></div> )
                }
                {   /* suspend item button */
                    this.listDataStore.canSuspendCurrentEditItem &&
                    <div style={formButtonStyle}><RaisedButton label={'suspend item'} backgroundColor='#EEB3B3' onClick={this.listDataStore.openSuspensionDialogue} disabled={this.listDataStore.asyncPendingLockout} /></div>
                }
                {  /* render any additional view actions */
                    (function() {
                        if(this.listDataStore.currentView.additionalActions) {
                            return this.listDataStore.currentView.additionalActions.map((action, index) => {
                                // if the action does not have an isHidden() function, or if it does have an isHidden() function and it returns false, render the component
                                if(!action.isHidden || (action.isHidden && !action.isHidden(this.listDataStore))) {
                                    return (
                                        <div key={index} style={formButtonStyle}>
                                            <RaisedButton label={action.buttonLabel} backgroundColor={action.buttonColor} onClick={action.composeAction(this.listDataStore)} disabled={this.listDataStore.asyncPendingLockout} />
                                        </div>
                                    )
                                }
                            })
                        }
                    }).call(this)
                }
                </div>

                {/* Nested Suspension Confirmation Dialogue */}
                <Dialog contentStyle={suspensionDialogueStyle} open={this.listDataStore.isDisplaySuspensionDialogue} title='Confirm' modal={true} >
                    <div>{'Are you sure you want to suspend the current item?'}</div>
                    <RaisedButton label='Yes' style={formButtonStyle} onClick={this.listDataStore.suspendEditItem} />
                    <RaisedButton label='No' style={formButtonStyle} onClick={this.listDataStore.closeSuspensionDialogue} />
                </Dialog>

            </Dialog>
        )
    }

}