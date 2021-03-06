import { IUser } from '../model/Users';
import { TestListItems, TestUser } from '../model/MockObjects';
import { ListItem } from '../model/ListItem';
import * as dao from '../dataAccess/dataAccess'
import * as groups from '../model/Groups'
import IGroup from '../model/Groups';
import * as transformers from '../utils/transformers'
import * as Columns from '../model/Columns'
import { ILookupOptionDictionary } from '../model/Columns';
import * as PdfService from './PdfService'


export async function fetchCurrentUser(): Promise<IUser> {
    const rawUserInfo = await dao.fetchCurrentUserFromServer()
    const rawGroupInfo = await dao.genericGetByEndpoint(rawUserInfo.d.Groups.__deferred.uri)

    // resolve the raw group info into group objects
    let userGroups = getUserGroupFromRawGroupInfo(rawGroupInfo)

    const user: IUser = {
        name: rawUserInfo.d.Title,
        email: rawUserInfo.d.Email,
        netId: rawUserInfo.d.LoginName,
        groups: userGroups
    }

    return Promise.resolve(user)
    //return Promise.resolve(TestUser)
}

export async function fetchListItems(): Promise<ListItem[]> {
    const rawListData = await dao.fetchListItemsFromServer()
    const listItems = transformers.listItemDTOsToListItems(rawListData.d.results)

    return Promise.resolve(listItems)
    //return Promise.resolve(TestListItems)
}


export async function fetchLookupValues(): Promise<Map<string, ILookupOptionDictionary>> {
    const storeMap: Map<string, ILookupOptionDictionary> = new Map()
    
    // Collecting Area
    // TODO optimize for arbitrary list as opposed to hardcoding each lookup column?
    const colAreaData = await dao.fetchLookupValuesFromServer('Collecting Areas')
    const colAreaOptionDictionary: ILookupOptionDictionary = {}
    colAreaData.d.results.forEach((rawColAreaObject) => colAreaOptionDictionary[rawColAreaObject.Id] = rawColAreaObject.Title)
    storeMap.set('Collecting_x0020_AreaId', colAreaOptionDictionary)

    return Promise.resolve(storeMap)
    //return Promise.resolve(new Map().set('Collecting_x0020_AreaId', {5: 'option1', 6: 'option2'}))
}


export async function createListItem(listItem: ListItem) {
    const rawSecurityInfo = await dao.fetchSecurityValidation()
    const createInfo = await dao.createListItemOnServer(listItem, rawSecurityInfo.d.GetContextWebInformation.FormDigestValue)
    return createInfo.d
}

export async function updateListItem(listItem: ListItem) {
    const rawSecurityInfo = await dao.fetchSecurityValidation()
    await dao.updateListItemOnServer(listItem, rawSecurityInfo.d.GetContextWebInformation.FormDigestValue)
    return listItem
}

export async function createListItemPdf(listItem: ListItem) {
    const rawSecurityInfo = await dao.fetchSecurityValidation()
    const pdfBuffer: ArrayBuffer = await PdfService.generateListItemPdfBuffer(listItem)
    const createInfo = await dao.savePdfToServer(pdfBuffer, `${listItem.Call_x0020_Number}.pdf`, rawSecurityInfo.d.GetContextWebInformation.FormDigestValue)
    return createInfo.d
}

// fetches the SP Group, then fetches the users from the group and then selects the email from each user
// the subject and body params are used to send an email to each of the user emails
export async function emailGroup(group: string, subject: string, body: string ) {
    const rawSecurityInfo = await dao.fetchSecurityValidation()
    const rawGroupData = await dao.fetchGroup(group)
    const rawGroupUserData = await dao.genericGetByEndpoint(rawGroupData.d.Users.__deferred.uri)
    const emailAddresses: string[] = rawGroupUserData.d.results.map(user => user.Email)

    // TODO pass in emailAddresses instead of array w/ my email
    await dao.sendEmail(['connor.moody@byu.edu'], subject, body, rawSecurityInfo.d.GetContextWebInformation.FormDigestValue)
}


// private helper function to resolve the raw group data received from the server into a group array for the current user object
function getUserGroupFromRawGroupInfo(rawGroupInfo): IGroup[] {
    const userGroups: Array<IGroup> = []
    const adminGroup = rawGroupInfo.d.results.find(element => element.Title === 'LTPSC Administrators')

    // if the user is an admin
    if(adminGroup) {
        // add all groups to the userGroups 
        Object.keys(groups).forEach(groupKey => userGroups.push(groups[groupKey]))
    } else {
        // otherwise, iterate through user's fetched group array and add corresponding groups to the user group array
        rawGroupInfo.d.results.forEach(element => {
            const inCodeGroupName = element.Title.replace(' ', '')
            if(groups[inCodeGroupName]) {
                userGroups.push(groups[inCodeGroupName])
            }
        });
    }

    return userGroups
}
