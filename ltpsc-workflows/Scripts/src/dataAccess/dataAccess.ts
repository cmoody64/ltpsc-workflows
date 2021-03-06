import { ajax } from 'jquery'
import * as $ from 'jquery'
import { ListItem } from '../model/ListItem';

const hostWebUrl = 'https://ltpsc-workflows.byu.edu'
const archiveLibraryUrl = 'Archive'

export function fetchCurrentUserFromServer(): JQueryXHR {
    return ajax({
        url: '../_api/web/currentuser',
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' },
    })
}


// generic GET call to the supplied endpoint
export function genericGetByEndpoint(endpoint: string): JQueryXHR {
    return ajax({
        url: endpoint,
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' },
    })
}

export function fetchListItemsFromServer(): JQueryXHR {
    return ajax({
        url: `../_api/SP.AppContextSite(@target)/web/lists/getbytitle('LTPSC')/items?$filter=Stage ne 'Complete'&@target='${hostWebUrl}'`,
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' }
    })
}

export function fetchLookupValuesFromServer(listName: string): JQueryXHR {
    return ajax({
        url: `../_api/SP.AppContextSite(@target)/web/lists/getbytitle('${listName}')/items?@target='${hostWebUrl}'`,
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' }
    })
}

export function createListItemOnServer(listItem: ListItem, requestDigest: string): JQueryXHR {
    const spListItem = Object.assign(listItem, { __metadata: {'type': 'SP.Data.LTPSC_x0020_AllListItem'}})
    return ajax({
        url: `../_api/SP.AppContextSite(@target)/web/lists/getbytitle('LTPSC')/items?@target='${hostWebUrl}'`,
        method: 'POST',
        contentType: 'application/json; odata=verbose',
        headers: {
            'Accept': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest,
            'contentType': 'application/json; odata=verbose'
        },
        data : JSON.stringify(spListItem)
    })
}

export function updateListItemOnServer(listItem: ListItem, requestDigest: string): JQueryXHR {
    const spListItem = Object.assign(listItem, { __metadata: {'type': 'SP.Data.LTPSC_x0020_AllListItem'}})
    return ajax({
        url: `../_api/SP.AppContextSite(@target)/web/lists/getbytitle('LTPSC')/items(${listItem.Id})?@target='${hostWebUrl}'`,
        method: 'POST',
        contentType: 'application/json; odata=verbose',
        headers: {
            'Accept': 'application/json; odata=verbose',
            'X-RequestDigest': requestDigest,
            'contentType': 'application/json; odata=verbose',
            'X-HTTP-Method': 'MERGE',
            'IF-MATCH': '*'
        },
        data : JSON.stringify(listItem)
    })
}

export function fetchSecurityValidation(): JQueryXHR {
    return ajax({
        url: `../_api/contextinfo`,
        method: "POST",
        contentType: "application/json; odata=verbose",
        headers: { "Accept": "application/json; odata=verbose" }
    });
}

export function savePdfToServer(pdfBuffer: ArrayBuffer, filename: string, requestDigest: string): JQueryXHR {
    return ajax({
        url: `../_api/SP.AppContextSite(@target)/web/getfolderbyserverrelativeurl('${archiveLibraryUrl}')/files/add(overwrite=true,url='${filename}')?@target='${hostWebUrl}'`,
        method: 'POST',
        processData: false,
        headers: {
            'accept': 'application/json;odata=verbose',
            'X-RequestDigest': requestDigest,
             'contentType': 'application/json; odata=verbose'
         },
         data: pdfBuffer
    })
}

export function sendEmail(emailAddresses: string[], subject: string, body: string, requestDigest: string ): JQueryXHR {
    return ajax({
        url: '../_api/SP.Utilities.Utility.SendEmail',
        method: 'POST',
        contentType: "application/json; odata=verbose",
        headers: {
            "Accept": "application/json;odata=verbose",
            "content-type": "application/json;odata=verbose",
            "X-RequestDigest": requestDigest
        },
        data: JSON.stringify({
            'properties': {
                '__metadata': {
                    'type': 'SP.Utilities.EmailProperties'
                },
                'From': 'LTPSC SharePoint Workflows',
                'To': {
                    'results': emailAddresses
                },
                'Body': body,
                'Subject': subject
            }
        })
    })
}

export function fetchGroup(group: string): JQueryXHR {
    return ajax({
        url: `../_api/SP.AppContextSite(@target)/web/sitegroups/getbyname('${group}')?@target='${hostWebUrl}'`,
        method: 'GET',
        headers: { 'Accept': 'application/json; odata=verbose' }
    })
}